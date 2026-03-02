import express from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import { authMiddleware } from '../middleware/auth'
import { extractTransactionsSimple } from '../utils/localModel'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

import { decrypt } from '../services/aiProviders';

const prisma = new PrismaClient()
const execAsync = promisify(exec)
const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/csv') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and CSV files are allowed'))
    }
  }
})

// Parse PDF using AI model (Kimi/Gemini) - PRIMARY METHOD
router.post('/parse-pdf-ai', authMiddleware as any, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const file = req.file
    
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported for AI parsing' })
    }

    // Get user's AI settings from database
    const userId = req.user?.id
    const userSettings = await prisma.user_settings.findUnique({
      where: { user_id: userId }
    })
    
    // Decrypt user's API key if they have one stored
    let userApiKey = null
    if (userSettings?.ai_enabled && userSettings?.ai_api_key && userSettings?.ai_provider) {
      try {
        const decrypted = decrypt(userSettings.ai_api_key);
        // New format: JSON object with keys per provider
        if (decrypted.startsWith('{')) {
          const keys = JSON.parse(decrypted);
          userApiKey = keys[userSettings.ai_provider];
        } else {
          // Legacy: single key for current provider
          userApiKey = decrypted;
        }
        if (userApiKey) {
          console.log(`Using user's stored API key for ${userSettings.ai_provider} parsing`)
        }
      } catch (e) {
        console.error('Failed to decrypt user API key:', e)
      }
    }

    // Convert PDF to base64 for AI model
    const pdfBase64 = file.buffer.toString('base64')
    
    // Try Kimi API first
    const KIMI_API_KEY = process.env.KIMI_API_KEY
    let aiResponse = null
    
    if (KIMI_API_KEY) {
      try {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIMI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'kimi-k2.5',
            messages: [
              {
                role: 'system',
                content: 'You are a financial document parser. Extract all transaction data from bank statements accurately. Return ONLY valid JSON.'
              },
              {
                role: 'user',
                content: `Extract ALL transactions from this bank statement PDF. Return as JSON format:

{
  "bankName": "bank name",
  "currency": "AUD/USD/etc",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "transaction description",
      "amount": 123.45,
      "type": "debit|credit",
      "merchant": "merchant name",
      "category": "Food|Transport|Shopping|etc"
    }
  ]
}

Rules:
1. Extract EVERY transaction including small amounts and cashback
2. Cashback entries should have type: "credit"
3. Expenses/debits should have type: "debit"
4. Use YYYY-MM-DD date format
5. Extract merchant names where possible
6. Categorize each transaction` 
              }
            ],
            file: {
              data: pdfBase64,
              mime_type: 'application/pdf',
              filename: file.originalname
            },
            temperature: 0.1
          })
        })

        if (response.ok) {
          const result = await response.json() as any
          const content = result.choices?.[0]?.message?.content || ''
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            aiResponse = JSON.parse(jsonMatch[0])
          }
        }
      } catch (aiError) {
        console.error('AI parsing failed:', aiError)
      }
    }

    // Fallback to Z.ai using user's stored key or env var
    if (!aiResponse && (userApiKey || process.env.ZAI_API_KEY || process.env.GLM5_API_KEY)) {
      const ZAI_KEY = userApiKey || process.env.ZAI_API_KEY || process.env.GLM5_API_KEY
      try {
        console.log('Trying Z.ai API for PDF parsing...')
        const response = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ZAI_KEY}`
          },
          body: JSON.stringify({
            model: 'glm-5',
            messages: [
              {
                role: 'system',
                content: 'You are a financial document parser. Extract all transaction data from bank statements accurately. Return ONLY valid JSON.'
              },
              {
                role: 'user',
                content: `Extract ALL transactions from this bank statement PDF (base64 encoded). Return as JSON format:

{
  "bankName": "bank name",
  "currency": "AUD/USD/etc",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "transaction description",
      "amount": 123.45,
      "type": "debit|credit",
      "merchant": "merchant name",
      "category": "Food|Transport|Shopping|etc"
    }
  ]
}

Rules:
1. Extract EVERY transaction including small amounts and cashback
2. Cashback entries should have type: "credit"
3. Expenses/debits should have type: "debit"
4. Use YYYY-MM-DD date format
5. Extract merchant names where possible
6. Categorize each transaction

PDF (base64): ${pdfBase64.substring(0, 100000)}` // Limit size
              }
            ],
            temperature: 0.1
          })
        })

        if (response.ok) {
          const result = await response.json() as any
          const content = result.choices?.[0]?.message?.content || ''
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            aiResponse = JSON.parse(jsonMatch[0])
            console.log('Z.ai parsing successful')
          }
        }
      } catch (zaiError) {
        console.error('Z.ai parsing failed:', zaiError)
      }
    }

    // Fallback to Gemini if Kimi and Z.ai fail
    if (!aiResponse) {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY
      if (GEMINI_API_KEY) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: `Extract ALL transactions from this bank statement PDF. Return as JSON format:
{
  "bankName": "bank name",
  "currency": "AUD/USD/etc", 
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "transaction description",
      "amount": 123.45,
      "type": "debit|credit",
      "merchant": "merchant name",
      "category": "Food|Transport|Shopping|etc"
    }
  ]
}

Extract EVERY transaction including cashback entries. Cashback = credit type, Expenses = debit type.`
                  },
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: pdfBase64
                    }
                  }
                ]
              }]
            })
          })

          if (response.ok) {
            const result = await response.json() as any
            const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
            
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              aiResponse = JSON.parse(jsonMatch[0])
            }
          }
        } catch (geminiError) {
          console.error('Gemini parsing failed:', geminiError)
        }
      }
    }

    if (aiResponse && aiResponse.transactions) {
      return res.json({
        success: true,
        fileName: file.originalname,
        extractionMethod: 'ai',
        bankName: aiResponse.bankName || 'Unknown Bank',
        currency: aiResponse.currency || 'USD',
        transactions: aiResponse.transactions.map((tx: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          date: tx.date,
          description: tx.description,
          amount: parseFloat(tx.amount) || 0,
          type: tx.type || 'debit',
          merchant: tx.merchant,
          category: tx.category || 'Other',
          confidence: 0.95
        })),
        totalTransactions: aiResponse.transactions.length
      })
    }

    // Try Hugging Face if user's provider is huggingface
    if (!aiResponse && userSettings?.ai_provider === 'huggingface' && userApiKey) {
      try {
        console.log('Trying Hugging Face API for PDF parsing...')
        const hfModel = userSettings.ai_model || 'meta-llama/Llama-3.2-11B-Vision-Instruct'
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${hfModel}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userApiKey}`
          },
          body: JSON.stringify({
            model: hfModel,
            messages: [
              {
                role: 'system',
                content: 'You are a financial document parser. Extract all transaction data from bank statements accurately. Return ONLY valid JSON.'
              },
              {
                role: 'user',
                content: `Extract ALL transactions from this bank statement PDF (base64). Return as JSON:

{
  "bankName": "bank name",
  "currency": "AUD/USD/etc",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "transaction description",
      "amount": 123.45,
      "type": "debit|credit",
      "merchant": "merchant name",
      "category": "Food|Transport|Shopping|etc"
    }
  ]
}

Rules:
1. Extract EVERY transaction including small amounts and cashback
2. Cashback entries should have type: "credit"
3. Expenses/debits should have type: "debit"
4. Use YYYY-MM-DD date format
5. Extract merchant names where possible
6. Categorize each transaction

PDF (base64, first 150KB): ${pdfBase64.substring(0, 150000)}`
              }
            ],
            max_tokens: 4096
          })
        })

        if (response.ok) {
          const result = await response.json() as any
          const content = result.choices?.[0]?.message?.content || ''
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            aiResponse = JSON.parse(jsonMatch[0])
            console.log('Hugging Face parsing successful')
          }
        } else {
          const errorData = await response.text()
          console.error('Hugging Face API error:', errorData)
          throw new Error('Hugging Face API failed: ' + errorData)
        }
      } catch (hfError: any) {
        console.error('Hugging Face parsing failed:', hfError.message)
        // Return friendly error with fallback suggestion
        return res.status(503).json({
          error: 'AI_SERVICE_UNAVAILABLE',
          message: 'The AI service is currently unavailable or slow to respond.',
          fallback: 'local',
          suggestion: 'Would you like to try local parsing instead? It is faster but may be less accurate for complex layouts.',
          details: hfError.message
        })
      }
    }

    // If AI fails, fallback to local Python parser
    const tempId = uuidv4()
    const tempPath = path.join('/tmp', `stmt-${tempId}.pdf`)
    fs.writeFileSync(tempPath, file.buffer)

    try {
      const scriptPath = path.join(__dirname, '..', '..', 'src', 'utils', 'pdf_parser.py')
      const { stdout } = await execAsync(`python3 "${scriptPath}" "${tempPath}"`)
      const result = JSON.parse(stdout)
      fs.unlinkSync(tempPath)

      return res.json({
        success: true,
        fileName: file.originalname,
        extractionMethod: 'pdfplumber',
        ...result
      })
    } catch (e) {
      fs.unlinkSync(tempPath)
      throw e
    }

  } catch (error: any) {
    console.error('AI PDF parse error:', error)
    res.status(500).json({
      error: 'Failed to parse PDF with AI',
      details: error.message
    })
  }
})

// Parse PDF statement (legacy endpoint - now uses AI)
router.post('/parse-pdf', authMiddleware as any, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const file = req.file
    
    if (file.mimetype === 'application/pdf') {
      // Forward to AI parser
      const tempId = uuidv4()
      const tempPath = path.join('/tmp', `stmt-${tempId}.pdf`)
      fs.writeFileSync(tempPath, file.buffer)

      try {
        const scriptPath = path.join(__dirname, '..', '..', 'src', 'utils', 'pdf_parser.py')
        const { stdout } = await execAsync(`python3 "${scriptPath}" "${tempPath}"`)
        const result = JSON.parse(stdout)
        fs.unlinkSync(tempPath)
        
        return res.json({
          success: true,
          fileName: file.originalname,
          extractionMethod: 'pdfplumber',
          text: JSON.stringify(result.transactions, null, 2),
          pageCount: result.transactions.length,
          structured: result
        })
      } catch (e) {
        fs.unlinkSync(tempPath)
        throw e
      }
    } else {
      // Return CSV as text
      const text = file.buffer.toString('utf-8')
      return res.json({
        success: true,
        fileName: file.originalname,
        text: text.substring(0, 50000),
        pageCount: 1,
        info: { type: 'csv' }
      })
    }
  } catch (error: any) {
    console.error('PDF parse error:', error)
    res.status(500).json({ 
      error: 'Failed to parse file',
      details: error.message 
    })
  }
})

// Simple exchange rate cache
const exchangeRates: Record<string, Record<string, number>> = {
  USD: { EGP: 50.5, EUR: 0.92, GBP: 0.79, AUD: 1.52, CAD: 1.36, AED: 3.67, SAR: 3.75 },
  EGP: { USD: 0.020, EUR: 0.018, GBP: 0.016, AED: 0.073, SAR: 0.075 },
  EUR: { USD: 1.09, EGP: 55.2, GBP: 0.86, AUD: 1.66, CAD: 1.48 },
  GBP: { USD: 1.27, EGP: 64.1, EUR: 1.17, AUD: 1.93, CAD: 1.72 },
  AUD: { USD: 0.66, EGP: 33.2, EUR: 0.60, GBP: 0.52, CAD: 0.89 },
  CAD: { USD: 0.74, EGP: 37.1, EUR: 0.68, GBP: 0.58, AUD: 1.12 },
  AED: { USD: 0.27, EGP: 13.7, SAR: 1.02 },
  SAR: { USD: 0.27, EGP: 13.3, AED: 0.98 }
}

function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount
  const rates = exchangeRates[from]
  if (!rates || !rates[to]) return amount
  return amount * rates[to]
}

// Extract transactions from parsed text using AI or local extraction
router.post('/extract-transactions', authMiddleware as any, async (req, res) => {
  try {
    const { text, bankName, targetCurrency, convertCurrency: shouldConvert, useLocal } = req.body

    if (!text) {
      return res.status(400).json({ error: 'No text provided' })
    }

    let parsed: any
    let extractionMethod = 'ai'

    // Try AI extraction first
    if (!useLocal) {
      const KIMI_API_KEY = process.env.KIMI_API_KEY
      if (KIMI_API_KEY) {
        try {
          const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${KIMI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'kimi-k2.5',
              messages: [
                { 
                  role: 'system', 
                  content: 'You are a financial document parser. Extract transaction data accurately and return as JSON.' 
                },
                { 
                  role: 'user', 
                  content: `Extract all transactions from this bank statement text and return as JSON.

Statement text:
${text.substring(0, 10000)}

Return ONLY a JSON object in this format:
{
  "bankName": "detected bank name",
  "accountNumber": "masked account number",
  "currency": "USD/EGP/AED/etc",
  "statementPeriod": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "transaction description",
      "amount": 123.45,
      "type": "debit" or "credit"
    }
  ]
}

Rules:
1. Parse ALL transactions visible
2. Amounts as positive numbers
3. Type: "debit" for money out, "credit" for money in
4. Use YYYY-MM-DD format
5. Clean descriptions` 
                }
              ],
              temperature: 0.1
            })
          })

          if (response.ok) {
            const aiResponse = await response.json() as any
            const content = aiResponse.choices?.[0]?.message?.content || ''
            
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0])
              }
            } catch {
              console.log('Kimi response parsing failed, falling back to local extraction')
            }
          }
        } catch (aiError) {
          console.log('Kimi extraction failed:', aiError)
        }
      }
    }

    // Fall back to local extraction if AI failed
    if (!parsed) {
      console.log('Using local ML model extraction')
      const localResult = extractTransactionsSimple(text, bankName)
      parsed = {
        bankName: localResult.bankName,
        currency: localResult.currency,
        statementPeriod: localResult.statementPeriod,
        transactions: localResult.transactions.map((tx: any) => ({
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          merchant: tx.merchant,
          category: tx.category
        }))
      }
      extractionMethod = 'local'
    }

    const statementCurrency = parsed.currency || 'USD'
    const targetCurr = targetCurrency || statementCurrency
    const shouldConvertAmounts = shouldConvert === true && targetCurr !== statementCurrency

    // Transform transactions
    const transactions = (parsed.transactions || []).map((tx: any, idx: number) => {
      const originalAmount = Math.abs(parseFloat(tx.amount) || 0)
      const convertedAmount = shouldConvertAmounts 
        ? convertCurrency(originalAmount, statementCurrency, targetCurr)
        : originalAmount
      
      return {
        id: `${extractionMethod}-${Date.now()}-${idx}`,
        date: normalizeDate(tx.date),
        description: tx.description || tx.merchant || 'Unknown',
        originalAmount,
        convertedAmount,
        amount: convertedAmount,
        originalCurrency: statementCurrency,
        targetCurrency: targetCurr,
        type: tx.type?.toLowerCase().includes('credit') ? 'credit' : 'debit',
        balance: tx.balance ? parseFloat(tx.balance) : undefined,
        category: tx.category || 'Other',
        merchant: tx.merchant
      }
    })

    res.json({
      success: true,
      bankName: parsed.bankName || bankName || 'Unknown Bank',
      accountNumber: parsed.accountNumber,
      originalCurrency: statementCurrency,
      targetCurrency: targetCurr,
      currencyConverted: shouldConvertAmounts,
      exchangeRate: shouldConvertAmounts ? exchangeRates[statementCurrency]?.[targetCurr] : undefined,
      statementPeriod: parsed.statementPeriod,
      extractionMethod,
      transactions,
      totalCredits: transactions.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0),
      totalDebits: transactions.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + t.amount, 0)
    })

  } catch (error: any) {
    console.error('Extract transactions error:', error)
    res.status(500).json({ 
      error: 'Failed to extract transactions',
      details: error.message 
    })
  }
})

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  
  // Try DD/MM/YYYY
  let match = dateStr.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/)
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }
  
  // Try native parsing
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  
  return new Date().toISOString().split('T')[0]
}

export default router

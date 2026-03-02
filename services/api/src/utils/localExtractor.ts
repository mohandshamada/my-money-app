import { pipeline, env } from '@xenova/transformers'

// Use local cache
env.cacheDir = './.cache'
env.allowLocalModels = true
env.allowRemoteModels = true

interface ExtractedTransaction {
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
}

interface ExtractionResult {
  bankName: string
  currency: string
  transactions: ExtractedTransaction[]
}

// Skip non-transaction lines
const SKIP_PATTERNS = [
  /BALANCE BROUGHT FORWARD/i,
  /CLOSING BALANCE/i,
  /OPENING BALANCE/i,
  /^\s*$/
]

// Simple pattern-based extraction (no ML needed for most cases)
export function extractTransactionsLocal(text: string, bankName?: string): ExtractionResult {
  const transactions: ExtractedTransaction[] = []
  const lines = text.split('\n')
  
  // Detect currency from text
  let currency = 'USD'
  if (text.includes('AUD') || text.includes('Australian')) currency = 'AUD'
  else if (text.includes('EGP') || text.includes('Egyptian')) currency = 'EGP'
  else if (text.includes('EUR') || text.includes('Euro')) currency = 'EUR'
  else if (text.includes('GBP') || text.includes('Pound')) currency = 'GBP'
  
  // Detect bank from text
  const detectedBank = bankName || 
    (text.includes('HSBC') ? 'HSBC' :
     text.includes('CIB') ? 'CIB' :
     text.includes('QNB') ? 'QNB' :
     text.includes('Banque Misr') ? 'Banque Misr' :
     'Unknown Bank')
  
  // Patterns for different date formats
  const datePatterns = [
    // DD MMM (e.g., "16 Jan")
    { regex: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i, format: 'dd_mmm' },
    // DD/MM/YYYY or DD-MM-YYYY
    { regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, format: 'ddmmyyyy' },
    // YYYY-MM-DD
    { regex: /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, format: 'yyyymmdd' },
  ]
  
  // Amount patterns
  const amountPattern = /(\d{1,3}(?:,\d{3})*\.?\d{0,2})|(\d+\.\d{2})/
  
  // Process each line
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 10) continue

    // Skip balance-only lines
    let skipLine = false
    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(trimmed)) {
        skipLine = true
        break
      }
    }
    if (skipLine) continue

    // Try to find date
    let dateStr = ''
    for (const pattern of datePatterns) {
      const match = trimmed.match(pattern.regex)
      if (match) {
        if (pattern.format === 'dd_mmm') {
          const monthMap: Record<string, string> = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
          }
          const day = match[1].padStart(2, '0')
          const month = monthMap[match[2].toLowerCase()] || '01'
          dateStr = `2026-${month}-${day}`
        } else if (pattern.format === 'ddmmyyyy') {
          const day = match[1].padStart(2, '0')
          const month = match[2].padStart(2, '0')
          const year = match[3].length === 2 ? `20${match[3]}` : match[3]
          dateStr = `${year}-${month}-${day}`
        } else if (pattern.format === 'yyyymmdd') {
          dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
        }
        break
      }
    }
    
    if (!dateStr) continue
    
    // Find amounts in the line
    const amounts: number[] = []
    let amountMatch
    const amountRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/g
    while ((amountMatch = amountRegex.exec(trimmed)) !== null) {
      amounts.push(parseFloat(amountMatch[1].replace(/,/g, '')))
    }
    
    if (amounts.length === 0) continue
    
    // Determine transaction type and amount
    // For HSBC: debits are expenses (money out), credits are deposits (money in)
    let amount = amounts[0]
    let type: 'debit' | 'credit' = 'debit'
    
    // Look for keywords indicating transaction type
    const upperLine = trimmed.toUpperCase()
    if (upperLine.includes('TRANSFER TO') || 
        upperLine.includes('EFTPOS VISA') ||
        upperLine.includes('PAYIN4') ||
        upperLine.includes('PAYPAL') ||
        upperLine.includes('PAYMENT')) {
      type = 'debit'
    } else if (upperLine.includes('TRANSFER FROM') ||
               upperLine.includes('DEPOSIT') ||
               upperLine.includes('CREDIT') ||
               upperLine.includes('CASHBACK')) {
      type = 'credit'
    }
    
    // Extract description (everything between date and amounts)
    let description = trimmed
      .replace(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{0,4}/i, '')
      .replace(/\d{1,3}(?:,\d{3})*\.\d{2}/g, '')
      .replace(/\d{4}-\d{2}-\d{2}/g, '')
      .replace(/AUD|USD|EGP|EUR|GBP/g, '')
      .replace(/EFTPOS VISA/i, '')
      .replace(/\d{6,}/g, '') // Remove long numbers (card numbers, etc)
      .trim()
    
    // Clean up description
    description = description
      .replace(/\s+/g, ' ')
      .replace(/^[-\s]+/, '')
      .substring(0, 100)
    
    // Skip if description is too short or is a balance entry
    if (description.length < 3 || /BALANCE|CLOSING|OPENING/i.test(description)) continue
    
    transactions.push({
      date: dateStr,
      description,
      amount,
      type
    })
  }
  
  return {
    bankName: detectedBank,
    currency,
    transactions
  }
}

// Optional: Use small NER model for better merchant extraction
let nerPipeline: any = null

export async function extractWithNER(text: string): Promise<string[]> {
  if (!nerPipeline) {
    nerPipeline = await pipeline('ner', 'Xenova/bert-base-NER', {
      quantized: true // Use smaller quantized model
    })
  }
  
  const results = await nerPipeline(text)
  // Extract organization names (merchants)
  const merchants = results
    .filter((r: any) => r.entity === 'B-ORG' || r.entity === 'I-ORG')
    .map((r: any) => r.word)
  
  return merchants
}

export default extractTransactionsLocal

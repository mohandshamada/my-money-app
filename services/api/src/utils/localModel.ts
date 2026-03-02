import { pipeline, env } from '@xenova/transformers'

// Configure environment
env.cacheDir = './.cache'
env.allowLocalModels = true
env.allowRemoteModels = true

interface ExtractedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  category?: string
  merchant?: string
  confidence: number
}

interface ExtractionResult {
  bankName: string
  currency: string
  statementPeriod?: { from: string; to: string }
  transactions: ExtractedTransaction[]
}

// Small model for NER (Named Entity Recognition)
let nerPipeline: any = null
// Small model for text classification
let classifierPipeline: any = null

// Category mapping based on merchant/description
const CATEGORY_PATTERNS = [
  { pattern: /netflix|hulu|disney|prime video|streaming/i, category: 'Entertainment', subcategory: 'Streaming' },
  { pattern: /spotify|apple music|youtube music/i, category: 'Entertainment', subcategory: 'Music' },
  { pattern: /grocery|supermarket|aldi|woolworth|coles|carrefour/i, category: 'Food', subcategory: 'Groceries' },
  { pattern: /restaurant|cafe|coffee|mcdonald|kfc|pizza/i, category: 'Food', subcategory: 'Dining Out' },
  { pattern: /gas|petrol|fuel|shell|esso|bp/i, category: 'Transport', subcategory: 'Fuel' },
  { pattern: /uber|lyft|taxi|ride|transport/i, category: 'Transport', subcategory: 'Ride Share' },
  { pattern: /amazon|ebay|shopping|retail|store/i, category: 'Shopping', subcategory: 'General' },
  { pattern: /pharmacy|chemist|medical|health/i, category: 'Health', subcategory: 'Pharmacy' },
  { pattern: /gym|fitness|sport/i, category: 'Health', subcategory: 'Fitness' },
  { pattern: /phone|mobile|internet|wifi|utility/i, category: 'Bills', subcategory: 'Utilities' },
  { pattern: /insurance|policy/i, category: 'Bills', subcategory: 'Insurance' },
  { pattern: /transfer|deposit|withdrawal/i, category: 'Transfer', subcategory: 'Banking' },
]

// Initialize models (lazy loading)
async function getNERPipeline() {
  if (!nerPipeline) {
    console.log('Loading NER model...')
    // Using a small distilled BERT model for NER (~66MB)
    nerPipeline = await pipeline('ner', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
      quantized: true, // Use 8-bit quantized version for smaller size
    })
    console.log('NER model loaded')
  }
  return nerPipeline
}

async function getClassifierPipeline() {
  if (!classifierPipeline) {
    console.log('Loading classification model...')
    // Small model for sequence classification (~66MB)
    classifierPipeline = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
      quantized: true,
    })
    console.log('Classification model loaded')
  }
  return classifierPipeline
}

// Main extraction function using local small model
export async function extractWithLocalModel(text: string, bankName?: string): Promise<ExtractionResult> {
  const lines = text.split('\n')
  const transactions: ExtractedTransaction[] = []
  
  // Detect currency and bank
  let currency = detectCurrency(text)
  const detectedBank = bankName || detectBank(text)
  
  // Extract statement period
  const statementPeriod = extractStatementPeriod(text)
  
  // Process each line with pattern matching + ML enhancement
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.length < 10) continue
    
    // Try to extract transaction data
    const tx = await extractTransactionLine(line, i)
    if (tx) {
      transactions.push(tx)
    }
  }
  
  // Post-process: merge multi-line transactions
  const mergedTransactions = mergeMultiLineTransactions(transactions)
  
  return {
    bankName: detectedBank,
    currency,
    statementPeriod,
    transactions: mergedTransactions
  }
}

// Extract single transaction from a line
async function extractTransactionLine(line: string, index: number): Promise<ExtractedTransaction | null> {
  // Skip balance-only lines early
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(line)) return null
  }
  
  // Extract date
  const date = extractDate(line)
  if (!date) return null
  
  // Extract amount
  const amountData = extractAmount(line)
  if (!amountData) return null
  
  // Extract description and merchant
  const descData = extractDescription(line)
  if (!descData) return null
  
  // Classify transaction
  const category = classifyTransaction(descData.description)
  
  return {
    id: `local-${Date.now()}-${index}`,
    date,
    description: descData.description,
    amount: amountData.amount,
    type: amountData.type,
    merchant: descData.merchant,
    category: category.category,
    confidence: 0.85
  }
}

// Extract date from line
function extractDate(line: string): string | null {
  const patterns = [
    // DD MMM (e.g., "16 Jan")
    { regex: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i, format: 'dd_mmm' },
    // DD/MM/YYYY or DD-MM-YYYY
    { regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, format: 'ddmmyyyy' },
    // YYYY-MM-DD
    { regex: /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, format: 'yyyymmdd' },
  ]
  
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  }
  
  for (const pattern of patterns) {
    const match = line.match(pattern.regex)
    if (match) {
      if (pattern.format === 'dd_mmm') {
        const day = match[1].padStart(2, '0')
        const month = monthMap[match[2].toLowerCase()] || '01'
        return `2026-${month}-${day}`
      } else if (pattern.format === 'ddmmyyyy') {
        const day = match[1].padStart(2, '0')
        const month = match[2].padStart(2, '0')
        const year = match[3].length === 2 ? `20${match[3]}` : match[3]
        return `${year}-${month}-${day}`
      } else if (pattern.format === 'yyyymmdd') {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      }
    }
  }
  
  return null
}

// Extract amount and determine type
function extractAmount(line: string): { amount: number; type: 'debit' | 'credit' } | null {
  const amounts: number[] = []
  const regex = /(\d{1,3}(?:,\d{3})*\.\d{2})/g
  let match
  
  while ((match = regex.exec(line)) !== null) {
    amounts.push(parseFloat(match[1].replace(/,/g, '')))
  }
  
  if (amounts.length === 0) return null
  
  // Use the first reasonable amount (not too large like balance)
  let amount = amounts[0]
  for (const a of amounts) {
    if (a > 0 && a < 100000) {
      amount = a
      break
    }
  }
  
  // Determine type based on keywords
  const upper = line.toUpperCase()
  const isCredit = upper.includes('DEPOSIT') || 
                   upper.includes('CREDIT') || 
                   upper.includes('TRANSFER FROM') ||
                   upper.includes('CASHBACK') ||
                   upper.includes('REFUND')
  
  const isDebit = upper.includes('EFTPOS') || 
                  upper.includes('WITHDRAWAL') || 
                  upper.includes('TRANSFER TO') ||
                  upper.includes('PAYMENT')
  
  // Default to debit if unclear
  const type: 'debit' | 'credit' = isCredit ? 'credit' : 'debit'
  
  return { amount, type }
}

// Skip non-transaction lines
const SKIP_PATTERNS = [
  /BALANCE BROUGHT FORWARD/i,
  /CLOSING BALANCE/i,
  /OPENING BALANCE/i,
  /^\s*$/
]

// Extract description and merchant
function extractDescription(line: string): { description: string; merchant?: string } | null {
  // Skip balance-only lines
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(line)) return null
  }
  
  // Remove date patterns (including year that might follow)
  let cleaned = line
    .replace(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{0,4}/i, '')
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '')
    .replace(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g, '')
  
  // Remove amounts
  cleaned = cleaned.replace(/\d{1,3}(?:,\d{3})*\.\d{2}/g, '')
  
  // Remove currency codes
  cleaned = cleaned.replace(/\b(AUD|USD|EGP|EUR|GBP|CAD|AED|SAR)\b/g, '')
  
  // Remove common transaction codes
  cleaned = cleaned.replace(/EFTPOS VISA/i, '')
  cleaned = cleaned.replace(/\b\d{6,}\b/g, '') // Long numbers (card numbers, refs)
  
  // Clean up
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Skip if description is too short after cleaning
  if (cleaned.length < 3) return null
  
  // Extract merchant (usually capitalized words at start)
  const merchantMatch = cleaned.match(/^([A-Z][A-Za-z0-9\s&]+?)(?:\s+[-\/]|\s{2,}|$)/)
  const merchant = merchantMatch ? merchantMatch[1].trim() : undefined
  
  return { description: cleaned.substring(0, 100), merchant }
}

// Classify transaction into category
function classifyTransaction(description: string): { category: string; subcategory: string } {
  const upperDesc = description.toUpperCase()
  
  for (const pattern of CATEGORY_PATTERNS) {
    if (pattern.pattern.test(description)) {
      return { category: pattern.category, subcategory: pattern.subcategory }
    }
  }
  
  // Default category
  return { category: 'Other', subcategory: 'General' }
}

// Detect currency from text
function detectCurrency(text: string): string {
  if (text.includes('AUD') || text.includes('Australian')) return 'AUD'
  if (text.includes('EGP') || text.includes('Egyptian Pound')) return 'EGP'
  if (text.includes('EUR') || text.includes('Euro')) return 'EUR'
  if (text.includes('GBP') || text.includes('British Pound')) return 'GBP'
  if (text.includes('CAD') || text.includes('Canadian')) return 'CAD'
  if (text.includes('AED') || text.includes('Dirham')) return 'AED'
  if (text.includes('SAR') || text.includes('Riyal')) return 'SAR'
  return 'USD'
}

// Detect bank from text
function detectBank(text: string): string {
  if (text.includes('HSBC')) return 'HSBC'
  if (text.includes('CIB') || text.includes('Commercial International Bank')) return 'CIB'
  if (text.includes('QNB')) return 'QNB'
  if (text.includes('Banque Misr')) return 'Banque Misr'
  if (text.includes('ANZ')) return 'ANZ'
  if (text.includes('Commonwealth')) return 'Commonwealth Bank'
  if (text.includes('Westpac')) return 'Westpac'
  return 'Unknown Bank'
}

// Extract statement period
function extractStatementPeriod(text: string): { from: string; to: string } | undefined {
  const patterns = [
    /STATEMENT PERIOD\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+TO\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
    /Period:\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+to\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
  ]
  
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  }
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (match[2].length === 3) {
        // Format: DD MMM YYYY
        const fromDay = match[1].padStart(2, '0')
        const fromMonth = monthMap[match[2].toLowerCase()]
        const fromYear = match[3]
        const toDay = match[4].padStart(2, '0')
        const toMonth = monthMap[match[5].toLowerCase()]
        const toYear = match[6]
        return {
          from: `${fromYear}-${fromMonth}-${fromDay}`,
          to: `${toYear}-${toMonth}-${toDay}`
        }
      }
    }
  }
  
  return undefined
}

// Merge multi-line transactions
function mergeMultiLineTransactions(transactions: ExtractedTransaction[]): ExtractedTransaction[] {
  const merged: ExtractedTransaction[] = []
  let current: ExtractedTransaction | null = null
  
  for (const tx of transactions) {
    if (!current || tx.date !== current.date || tx.amount !== current.amount) {
      if (current) merged.push(current)
      current = tx
    } else {
      // Same transaction, merge descriptions
      current.description = `${current.description} ${tx.description}`.substring(0, 150)
    }
  }
  
  if (current) merged.push(current)
  return merged
}

// Export simple extraction for fallback - IMPROVED for HSBC multi-line format
export function extractTransactionsSimple(text: string, bankName?: string): ExtractionResult {
  const lines = text.split('\n')
  const transactions: ExtractedTransaction[] = []
  
  let currency = detectCurrency(text)
  const detectedBank = bankName || detectBank(text)
  const statementPeriod = extractStatementPeriod(text)
  
  // Patterns
  const DATE_PATTERN = /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
  const SHORT_DATE_PATTERN = /^(\d{1,2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
  const AMOUNT_PATTERN = /(\d{1,3}(?:,\d{3})*\.\d{2})\s*$/
  const REF_NUM_PATTERN = /^\d{10,}\s+/  // Lines starting with reference numbers
  const EFTPOS_PATTERN = /^(EFTPOS|RTP|TRANSFER|PYPL|PAYPAL)/i
  const SKIP_KEYWORDS = /BALANCE|CLOSING|OPENING|Page\s+\d+\s+of|Statement period|Important Information|Details of your Accounts|Starting debit|CASHBACK|2% Cashback|Enjoy.*Cashback/i
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  }
  
  let currentDate: string | null = null
  let lastValidDate: string | null = null
  let currentDescription: string[] = []
  let pendingAmount: number | null = null
  let pendingType: 'debit' | 'credit' = 'debit'
  let linesSinceDate = 0
  
  function saveTransaction() {
    if (currentDate && currentDescription.length > 0 && pendingAmount !== null && pendingAmount > 0) {
      const desc = currentDescription.join(' ').trim()
      // Skip if description is too short or contains skip keywords
      if (desc.length > 3 && 
          !SKIP_KEYWORDS.test(desc) &&
          !desc.match(/^(EFTPOS|RTP|TRANSFER)\s*$/i)) {
        transactions.push({
          id: `simple-${Date.now()}-${transactions.length}`,
          date: currentDate,
          description: desc,
          amount: pendingAmount,
          type: pendingType,
          merchant: extractMerchant(desc),
          category: classifyTransaction(desc).category,
          confidence: 0.75
        })
      }
    }
    currentDescription = []
    pendingAmount = null
    linesSinceDate = 0
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines and headers
    if (line.length < 5) continue
    if (SKIP_KEYWORDS.test(line)) {
      saveTransaction()
      continue
    }
    
    // Skip short date lines (cashback entries like "18JAN26 ...")
    if (SHORT_DATE_PATTERN.test(line)) {
      continue
    }
    
    // Check if line starts with a date (DD MMM format)
    const dateMatch = line.match(DATE_PATTERN)
    
    if (dateMatch) {
      // Save previous transaction
      saveTransaction()
      
      // Start new transaction
      const day = dateMatch[1].padStart(2, '0')
      const month = monthMap[dateMatch[2].toLowerCase()] || '01'
      currentDate = `2026-${month}-${day}`
      lastValidDate = currentDate
      
      // Remove date from line and process rest
      let restOfLine = line.substring(dateMatch[0].length).trim()
      
      // Check if this line also has the amount
      const amountMatch = restOfLine.match(AMOUNT_PATTERN)
      if (amountMatch) {
        pendingAmount = parseFloat(amountMatch[1].replace(/,/g, ''))
        pendingType = determineType(restOfLine)
        const desc = restOfLine.replace(AMOUNT_PATTERN, '').trim()
        if (desc) currentDescription.push(desc)
        saveTransaction()
      } else {
        currentDescription.push(restOfLine)
        linesSinceDate = 1
        
        // Look for amount on subsequent lines
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const nextLine = lines[j].trim()
          if (nextLine.length < 3) continue
          
          // Stop if next line starts with a date
          if (DATE_PATTERN.test(nextLine)) break
          if (SHORT_DATE_PATTERN.test(nextLine)) break
          
          // Look for amount at end of line
          const nextAmountMatch = nextLine.match(AMOUNT_PATTERN)
          if (nextAmountMatch) {
            const potentialAmount = parseFloat(nextAmountMatch[1].replace(/,/g, ''))
            const descPart = nextLine.replace(AMOUNT_PATTERN, '').trim()
            
            // Validate: amount should be reasonable and we should have description
            if (potentialAmount > 0 && potentialAmount < 100000) {
              pendingAmount = potentialAmount
              pendingType = determineType(nextLine)
              if (descPart) currentDescription.push(descPart)
              i = j
              saveTransaction()
              break
            }
          } else if (!SKIP_KEYWORDS.test(nextLine)) {
            currentDescription.push(nextLine)
            linesSinceDate++
          }
        }
      }
    } else if (lastValidDate && (REF_NUM_PATTERN.test(line) || EFTPOS_PATTERN.test(line))) {
      // Lines starting with reference numbers or EFTPOS without date - use last date
      saveTransaction()
      
      currentDate = lastValidDate
      const amountMatch = line.match(AMOUNT_PATTERN)
      if (amountMatch) {
        pendingAmount = parseFloat(amountMatch[1].replace(/,/g, ''))
        pendingType = determineType(line)
        const desc = line.replace(REF_NUM_PATTERN, '').replace(AMOUNT_PATTERN, '').trim()
        if (desc) currentDescription.push(desc)
        saveTransaction()
      }
    }
  }
  
  // Don't forget the last transaction
  saveTransaction()
  
  return {
    bankName: detectedBank,
    currency,
    statementPeriod,
    transactions
  }
}

// Helper to determine transaction type
function determineType(line: string): 'debit' | 'credit' {
  const upper = line.toUpperCase()
  if (upper.includes('CASHBACK') || 
      upper.includes('CREDIT') || 
      upper.includes('DEPOSIT') ||
      upper.includes('TRANSFER FROM')) {
    return 'credit'
  }
  return 'debit'
}

// Helper to extract merchant
function extractMerchant(description: string): string | undefined {
  // Look for merchant patterns - usually all caps or title case at start
  const merchantMatch = description.match(/^([A-Z][A-Za-z0-9\s&\/\.]+?)(?:\s{2,}|\s+-|$)/)
  if (merchantMatch) {
    return merchantMatch[1].trim().substring(0, 50)
  }
  // Try matching known merchants
  const knownMerchants = [
    'ALDI', 'COLES', 'WOOLWORTHS', 'BIG W', 'BUNNINGS', 'COSTCO',
    'PAYPAL', 'PYPL', 'TRANSFER', 'EFTPOS', 'RTP'
  ]
  for (const merchant of knownMerchants) {
    if (description.toUpperCase().includes(merchant)) {
      return merchant
    }
  }
  return undefined
}

export default extractTransactionsSimple

#!/usr/bin/env python3
"""
Advanced PDF Statement Parser
Main entry point that uses the best available parsing strategy

Features:
- Primary: PyMuPDF-based intelligent parser (statement_parser_v2)
- Fallback: pdfplumber table extraction
- Multi-bank support with format detection
- Confidence scoring for extracted data
"""

import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from statement_parser_v3 import StatementParserV3, parse_statement as parse_v3
    V3_AVAILABLE = True
except ImportError:
    V3_AVAILABLE = False

try:
    from statement_parser_v2 import StatementParserV2, parse_statement as parse_v2
    V2_AVAILABLE = True
except ImportError:
    V2_AVAILABLE = False

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    from hsbc_parser_v3 import parse_hsbc_statement
    HSBC_V3_AVAILABLE = True
except ImportError:
    HSBC_V3_AVAILABLE = False

try:
    from hsbc_v4 import parse_hsbc_statement as parse_hsbc_v4
    HSBC_V4_AVAILABLE = True
except ImportError:
    HSBC_V4_AVAILABLE = False

try:
    from universal_parser import UniversalStatementParser
    UNIVERSAL_AVAILABLE = True
except ImportError:
    UNIVERSAL_AVAILABLE = False

try:
    from ai_statement_parser import parse_statement_with_ai
    AI_PARSER_AVAILABLE = True
except ImportError:
    AI_PARSER_AVAILABLE = False

try:
    from ocr_statement_parser import parse_statement_with_ocr
    OCR_PARSER_AVAILABLE = True
except ImportError:
    OCR_PARSER_AVAILABLE = False

from typing import List, Dict, Any, Optional
import json
import re
from datetime import datetime


def parse_statement(pdf_path: str, use_ai: bool = False, use_ocr: bool = False) -> Dict[str, Any]:
    """
    Main parser function that tries multiple strategies in order of reliability
    
    Args:
        pdf_path: Path to PDF file
        use_ai: Use AI vision parser (requires API key)
        use_ocr: Use OCR parser for scanned documents
    
    Strategy order:
    1. AI Vision parser (if use_ai=True) - Best accuracy
    2. OCR parser (if use_ocr=True) - For scanned documents
    3. statement_parser_v3 (PyMuPDF-based, captures cashback credits)
    4. statement_parser_v2 (PyMuPDF-based)
    5. hsbc_parser_v3 (PyMuPDF-based, HSBC-specific)
    6. pdfplumber table extraction (generic)
    7. pdfplumber text extraction (fallback)
    """
    
    # Try AI parser first if requested
    if use_ai and AI_PARSER_AVAILABLE:
        try:
            result = parse_statement_with_ai(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'ai_vision_parser'
                }
        except Exception as e:
            print(f"AI parser failed: {e}", file=sys.stderr)
    
    # Try OCR parser if requested
    if use_ocr and OCR_PARSER_AVAILABLE:
        try:
            result = parse_statement_with_ocr(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'tesseract_ocr'
                }
        except Exception as e:
            print(f"OCR parser failed: {e}", file=sys.stderr)
    
    # Try Universal parser first (handles all bank formats including multi-line transactions)
    if UNIVERSAL_AVAILABLE:
        try:
            parser = UniversalStatementParser()
            result = parser.parse(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'universal_parser'
                }
        except Exception as e:
            print(f"Universal parser failed: {e}", file=sys.stderr)
    
    # Try HSBC v4 parser first (best for HSBC statements, handles salary deposits correctly)
    if HSBC_V4_AVAILABLE:
        try:
            result = parse_hsbc_v4(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'hsbc_parser_v4'
                }
        except Exception as e:
            print(f"HSBC v4 parser failed: {e}", file=sys.stderr)
    
    # Try v3 parser (captures cashback credits)
    if V3_AVAILABLE:
        try:
            result = parse_v3(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'statement_parser_v3'
                }
        except Exception as e:
            print(f"V3 parser failed: {e}", file=sys.stderr)
    
    # Try v2 parser
    if V2_AVAILABLE:
        try:
            result = parse_v2(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'statement_parser_v2'
                }
        except Exception as e:
            print(f"V2 parser failed: {e}", file=sys.stderr)
    
    # Try HSBC v3 parser (fallback)
    if HSBC_V3_AVAILABLE:
        try:
            result = parse_hsbc_statement(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'hsbc_parser_v3'
                }
        except Exception as e:
            print(f"HSBC v3 parser failed: {e}", file=sys.stderr)
    
    # Try HSBC v4 parser (newest, handles salary deposits correctly)
    if HSBC_V4_AVAILABLE:
        try:
            result = parse_hsbc_v4(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return {
                    **result,
                    'extractionMethod': 'hsbc_parser_v4'
                }
        except Exception as e:
            print(f"HSBC v4 parser failed: {e}", file=sys.stderr)
    
    # Fallback to pdfplumber-based parsing
    if PDFPLUMBER_AVAILABLE:
        try:
            result = parse_with_pdfplumber(pdf_path)
            if result.get('transactions') and len(result['transactions']) > 0:
                return result
        except Exception as e:
            print(f"pdfplumber parser failed: {e}", file=sys.stderr)
    
    # Last resort - return empty structure
    return {
        "bankName": "Unknown Bank",
        "currency": "USD",
        "transactions": [],
        "totalTransactions": 0,
        "extractionMethod": "none",
        "error": "No parsing method succeeded"
    }


def parse_with_pdfplumber(pdf_path: str) -> Dict[str, Any]:
    """Fallback parser using pdfplumber"""
    
    with pdfplumber.open(pdf_path) as pdf:
        # Try table extraction first
        transactions = extract_from_tables(pdf)
        
        # If tables didn't work, try text parsing
        if len(transactions) < 3:
            transactions = extract_from_text(pdf)
        
        # Detect bank info
        bank_info = detect_bank_info(pdf)
        
        return {
            "bankName": bank_info.get("name", "Unknown Bank"),
            "currency": bank_info.get("currency", "USD"),
            "transactions": transactions,
            "totalTransactions": len(transactions),
            "extractionMethod": "pdfplumber"
        }


def extract_from_tables(pdf) -> List[Dict[str, Any]]:
    """Extract transactions from PDF tables"""
    transactions = []
    
    for page_num, page in enumerate(pdf.pages):
        try:
            tables = page.extract_tables()
            
            for table in tables:
                if not table or len(table) < 2:
                    continue
                
                header = table[0]
                col_indices = find_column_indices(header)
                
                if not col_indices:
                    continue
                
                for row in table[1:]:
                    tx = parse_table_row(row, col_indices)
                    if tx:
                        transactions.append(tx)
        
        except Exception as e:
            print(f"Error extracting tables from page {page_num}: {e}", file=sys.stderr)
            continue
    
    return transactions


def find_column_indices(header: List[str]) -> Optional[Dict[str, int]]:
    """Find column indices from header row"""
    if not header:
        return None
    
    headers = [str(h).lower().strip() if h else "" for h in header]
    result = {"date": None, "description": None, "debit": None, 
              "credit": None, "amount": None, "balance": None}
    
    for i, h in enumerate(headers):
        if any(kw in h for kw in ["date", "trans date"]):
            result["date"] = i
        elif any(kw in h for kw in ["description", "narrative", "details"]):
            result["description"] = i
        elif any(kw in h for kw in ["debit", "withdrawals"]):
            result["debit"] = i
        elif any(kw in h for kw in ["credit", "deposits"]):
            result["credit"] = i
        elif any(kw in h for kw in ["amount"]):
            result["amount"] = i
        elif any(kw in h for kw in ["balance"]):
            result["balance"] = i
    
    has_date = result["date"] is not None
    has_amount = result["amount"] is not None or (result["debit"] is not None and result["credit"] is not None)
    
    if has_date and has_amount:
        return result
    return None


def parse_table_row(row: List[str], col_indices: Dict[str, int]) -> Optional[Dict[str, Any]]:
    """Parse a single table row"""
    try:
        row = [str(cell).strip() if cell else "" for cell in row]
        
        # Skip totals
        full_text = " ".join(row).upper()
        if any(kw in full_text for kw in ["TOTAL", "BALANCE BROUGHT", "CLOSING"]):
            return None
        
        # Get date
        date_idx = col_indices.get("date")
        if date_idx is None or date_idx >= len(row):
            return None
        
        date = parse_date(row[date_idx])
        if not date:
            return None
        
        # Get description
        desc_idx = col_indices.get("description")
        description = row[desc_idx] if desc_idx is not None and desc_idx < len(row) else ""
        
        if not description or len(description) < 2:
            return None
        
        # Get amount
        amount = None
        tx_type = "debit"
        
        # Try debit/credit columns
        debit_idx = col_indices.get("debit")
        credit_idx = col_indices.get("credit")
        
        if debit_idx is not None and debit_idx < len(row):
            debit_amt = parse_amount(row[debit_idx])
            if debit_amt and debit_amt > 0:
                amount = debit_amt
                tx_type = "debit"
        
        if credit_idx is not None and credit_idx < len(row) and not amount:
            credit_amt = parse_amount(row[credit_idx])
            if credit_amt and credit_amt > 0:
                amount = credit_amt
                tx_type = "credit"
        
        # Try single amount column
        if not amount:
            amt_idx = col_indices.get("amount")
            if amt_idx is not None and amt_idx < len(row):
                amount = parse_amount(row[amt_idx])
                if amount:
                    tx_type = "credit" if amount < 0 else "debit"
                    amount = abs(amount)
        
        if not amount or amount <= 0 or amount > 1000000:
            return None
        
        return {
            "date": date,
            "description": description[:100],
            "amount": amount,
            "type": tx_type,
            "merchant": extract_merchant(description),
            "category": classify_transaction(description, tx_type == "credit"),
            "confidence": 0.85
        }
    
    except Exception:
        return None


def extract_from_text(pdf) -> List[Dict[str, Any]]:
    """Extract transactions from raw text"""
    transactions = []
    all_text = ""
    
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            all_text += "\n" + text
    
    lines = all_text.split("\n")
    
    for line in lines:
        if not line or len(line) < 10:
            continue
        
        # Look for date at start
        date_match = re.search(r'^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', line)
        if not date_match:
            continue
        
        date = parse_date(date_match.group(1))
        if not date:
            continue
        
        # Find amounts
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
        if not amounts:
            continue
        
        amount = parse_amount(amounts[0])
        if not amount:
            continue
        
        # Extract description
        desc_start = date_match.end()
        desc_end = line.rfind(amounts[-1]) if amounts else len(line)
        description = line[desc_start:desc_end].strip()
        
        if len(description) < 2:
            continue
        
        tx_type = "credit" if any(kw in line.upper() for kw in ["CREDIT", "DEPOSIT"]) else "debit"
        
        transactions.append({
            "date": date,
            "description": description[:100],
            "amount": amount,
            "type": tx_type,
            "merchant": extract_merchant(description),
            "category": classify_transaction(description, tx_type == "credit"),
            "confidence": 0.7
        })
    
    return transactions


def detect_bank_info(pdf) -> Dict[str, str]:
    """Detect bank name and currency from PDF"""
    all_text = ""
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            all_text += "\n" + text
    
    all_text = all_text.upper()
    
    banks = {
        "HSBC": "AUD",
        "CHASE": "USD",
        "CITIBANK": "USD",
        "NAB": "AUD",
        "CBA": "AUD",
        "COMMONWEALTH": "AUD",
        "ANZ": "AUD",
        "WESTPAC": "AUD",
        "NATIONAL BANK OF EGYPT": "EGP",
        "CIB": "EGP",
        "EMIRATES": "AED",
        "FAB": "AED",
        "ADCB": "AED"
    }
    
    for bank_name, currency in banks.items():
        if bank_name in all_text:
            return {"name": bank_name, "currency": currency}
    
    return {"name": "Unknown Bank", "currency": "USD"}


def parse_date(date_str: str) -> Optional[str]:
    """Parse various date formats"""
    if not date_str:
        return None
    
    date_str = date_str.strip()
    
    # Common formats
    formats = [
        (r'^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$', lambda m: (m.group(3), m.group(2), m.group(1))),
        (r'^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$', lambda m: (f"20{m.group(3)}", m.group(2), m.group(1))),
        (r'^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$', 
         lambda m: (m.group(3), str(['', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'][
             ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].index(m.group(2).upper())]), 
             m.group(1).zfill(2))),
    ]
    
    for pattern, extractor in formats:
        match = re.match(pattern, date_str, re.IGNORECASE)
        if match:
            try:
                year, month, day = extractor(match)
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            except:
                continue
    
    return None


def parse_amount(amount_str: str) -> Optional[float]:
    """Parse amount string to float"""
    if not amount_str:
        return None
    
    amount_str = str(amount_str).strip()
    amount_str = re.sub(r'[^\d.,\-]', '', amount_str)
    amount_str = amount_str.replace(',', '')
    
    try:
        return float(amount_str) if amount_str else None
    except:
        return None


def extract_merchant(desc: str) -> Optional[str]:
    """Extract merchant name from description"""
    known_merchants = [
        'ALDI', 'COLES', 'WOOLWORTHS', 'BIG W', 'BUNNINGS', 'COSTCO',
        'PAYPAL', 'PYPL', 'MYER', 'H&M', 'KMART', '7-ELEVEN', 'SHELL', 'BP',
        'AMAZON', 'UBER', 'NETFLIX', 'SPOTIFY', 'HARVEY NORMAN'
    ]
    
    upper_desc = desc.upper()
    for merchant in known_merchants:
        if merchant in upper_desc:
            return merchant.title()
    
    return None


def classify_transaction(desc: str, is_income: bool) -> str:
    """Classify transaction into category"""
    upper = desc.upper()
    
    if is_income:
        return 'Income'
    
    patterns = [
        (['NETFLIX', 'SPOTIFY'], 'Entertainment'),
        (['WOOLWORTHS', 'COLES', 'ALDI'], 'Food'),
        (['UBER'], 'Transport'),
        (['AMAZON'], 'Shopping'),
        (['PAYPAL', 'PYPL'], 'Transfer'),
    ]
    
    for keywords, category in patterns:
        if any(kw in upper for kw in keywords):
            return category
    
    return 'Other'


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 pdf_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = parse_statement(pdf_path)
    print(json.dumps(result, indent=2, default=str))

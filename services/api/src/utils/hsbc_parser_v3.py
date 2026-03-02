#!/usr/bin/env python3
"""
HSBC Statement Parser - Multi-line Transaction Support
Handles HSBC's complex layout where amounts are on separate lines
"""

import fitz  # PyMuPDF
import json
import re
import sys
from typing import List, Dict, Any, Optional, Tuple


def parse_hsbc_statement(pdf_path: str) -> Dict[str, Any]:
    """Parse HSBC bank statement PDF"""
    doc = fitz.open(pdf_path)
    all_lines = []

    for page in doc:
        text = page.get_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        all_lines.extend(lines)

    # Extract statement period to determine years
    year_range = extract_statement_year_range(all_lines)

    transactions = extract_hsbc_transactions_multiline(all_lines, year_range)

    return {
        "bankName": "HSBC",
        "currency": "AUD",
        "transactions": transactions,
        "totalTransactions": len(transactions)
    }


def extract_statement_year_range(lines: List[str]) -> Tuple[str, str]:
    """Extract statement year range from statement period line
    Returns (start_year, end_year) for a statement like "16 Dec 2025 to 16 Jan 2026"
    """
    for line in lines[:20]:  # Check first 20 lines for statement period
        # Look for "Statement period ... YYYY to ... YYYY" pattern
        matches = re.findall(r'(\d{4})', line)
        if len(matches) >= 2:
            return (matches[0], matches[1])
    return ('2025', '2025')  # Default


def extract_hsbc_transactions_multiline(lines: List[str], year_range: Tuple[str, str] = ('2025', '2025')) -> List[Dict[str, Any]]:
    """
    Extract transactions handling HSBC's multi-line format
    """
    transactions = []
    start_year, end_year = year_range

    # Month name to number mapping
    months = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    }
    
    # Skip patterns
    skip_patterns = [
        'Statement period', 'Page ', 'Financial Statement',
        'BALANCE BROUGHT FORWARD', 'CLOSING BALANCE', 'OPENING BALANCE',
        'Details of your Accounts', 'Important Information',
        'Your Deposits', 'Your Investments', 'Your Loans', 'Net position',
        'Here', 'Check your account', 'Set up account', 'Never share',
        'Always keep', 'Choose strong', 'Remember to', 'Stop, challenge',
        'Having trouble', 'Summary of your portfolio', 'TOTAL DEPOSITS',
        'Current Debit Balance', 'Interest Rate', 'Transaction Total'
    ]
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip header/footer lines
        if any(pattern in line for pattern in skip_patterns):
            i += 1
            continue
        
        # Check for date line: '30 Jan' or '19 Jan'
        date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', line, re.IGNORECASE)
        if date_match:
            i += 1
            continue
        
        # Check for cashback date format: '18JAN26' - skip these
        if re.match(r'\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}', line, re.IGNORECASE):
            i += 1
            continue
        
        # Check if this line has amounts
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)

        if amounts:
            # This line has amounts - could be a transaction line
            # Get description (part before first amount)
            desc = line
            for amt in amounts:
                desc = desc.replace(amt, '')
            desc = re.sub(r'\s+', ' ', desc).strip()

            # If description is empty or too short, look at previous lines
            if len(desc) < 3 or not any(c.isalpha() for c in desc):
                # Try to get description from previous non-empty lines
                for j in range(i-1, max(-1, i-5), -1):
                    prev_line = lines[j].strip()
                    # Skip date lines and continuation location codes
                    if prev_line and not re.match(r'\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', prev_line, re.I) \
                       and not re.match(r'\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)', prev_line, re.I) \
                       and prev_line and len(prev_line) > 3:
                        if any(c.isalpha() for c in prev_line):
                            desc = prev_line
                            break

            # Skip if still not a valid description
            if len(desc) < 3 or not any(c.isalpha() for c in desc):
                i += 1
                continue
            
            # Find transaction date by looking backwards
            tx_date = None
            for j in range(i-1, max(-1, i-15), -1):
                prev_line = lines[j]
                date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', prev_line, re.IGNORECASE)
                if date_match:
                    day = date_match.group(1)
                    month_name = date_match.group(2).upper()
                    month_num = months.get(month_name, '01')
                    # Use end_year for Jan-Nov if end_year > start_year (statement spans years)
                    year = end_year if month_num != '12' and end_year > start_year else start_year
                    tx_date = f'{year}-{month_num}-{int(day):02d}'
                    break

            # Special case: If description doesn't have EFTPOS/VISA and there's a date
            # coming up soon after this line, use that date (for deposits like salary)
            if tx_date and not ('EFTPOS' in desc.upper() or 'VISA' in desc.upper()):
                for j in range(i+1, min(len(lines), i+5)):
                    next_line = lines[j]
                    date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', next_line, re.IGNORECASE)
                    if date_match:
                        # Found a future date - check if it's within 3 lines
                        if j <= i + 3:
                            day = date_match.group(1)
                            month_name = date_match.group(2).upper()
                            month_num = months.get(month_name, '01')
                            # Use end_year for Jan-Nov if end_year > start_year
                            year = end_year if month_num != '12' and end_year > start_year else start_year
                            tx_date = f'{year}-{month_num}-{int(day):02d}'
                        break
            
            if not tx_date:
                i += 1
                continue
            
            # Process valid amounts
            for amt_str in amounts:
                amt = float(amt_str.replace(',', ''))
                
                # Skip running balances (> $10,000)
                if amt >= 10000:
                    continue
                
                # Skip very small amounts (partial matches)
                if amt < 0.01:
                    continue
                
                # Determine transaction type
                desc_upper = desc.upper()
                has_eftpos = 'EFTPOS' in desc_upper or 'VISA' in desc_upper
                has_cashback = 'CASHBACK' in desc_upper
                
                if has_cashback:
                    is_income = True
                elif has_eftpos:
                    is_income = False
                else:
                    is_income = any(kw in desc_upper for kw in [
                        'CREDIT', 'DEPOSIT', 'SALARY', 'PAYMENT IN',
                        'TRANSFER FROM', 'REFUND', 'HINDMARSH'
                    ])
                
                # Check for duplicates
                is_duplicate = any(
                    t['date'] == tx_date and 
                    abs(t['amount'] - amt) < 0.01
                    for t in transactions
                )
                
                if not is_duplicate:
                    transactions.append({
                        'date': tx_date,
                        'description': desc[:100],
                        'amount': amt,
                        'type': 'credit' if is_income else 'debit',
                        'merchant': extract_merchant(desc),
                        'category': classify_transaction(desc, is_income)
                    })
        
        i += 1
    
    return transactions


def extract_merchant(description: str) -> str:
    """Extract merchant name from description"""
    desc = description.strip()

    # Remove location codes like "SYDNEY AU", "PENRITH AU", etc. at the end
    desc_cleaned = re.sub(r'\s+[A-Z]{2}(?:\s|$)', ' ', desc).strip()

    # Special patterns with explicit handling
    if re.search(r'EFTPOS VISA AUD', desc_cleaned, re.IGNORECASE):
        # Extract merchant from EFTPOS line
        match = re.search(r'EFTPOS VISA AUD\s+([A-Z][A-Za-z0-9\s\*&\-\.]{2,}?)(?:\s*\d{4,})?(?:\s*$|\s+[A-Z]{2}\s)', desc_cleaned, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            # Remove trailing numbers and codes
            merchant = re.sub(r'\s+\d{4,}$', '', merchant)
            merchant = re.sub(r'\s+\d{1,3}$', '', merchant)
            if merchant and len(merchant) >= 2:
                return merchant.strip()[:50]

    patterns = [
        # RTP/Transfer patterns
        (r'^RTP\s+\d+\s+\d+\s+(.+?)(?:\s+\d+\.?\d*)?$', 1),
        (r'PAYPAL AUSTRALIA', 0),
        (r'PYPL\s+(\w+)', 1),
        (r'GLOBAL TRANSFER\s+(\w+)', 1),
        (r'^TRANSFER\s+(?:TO|FROM)\s+(.+?)$', 1),
    ]

    for pattern, group in patterns:
        match = re.search(pattern, desc_cleaned, re.IGNORECASE)
        if match:
            if group == 0:
                return match.group(0).strip()
            merchant = match.group(group).strip()
            if merchant and len(merchant) >= 2:
                return merchant.strip()[:50]

    # Fallback: get first capitalized word(s) that look like a merchant name
    words = desc_cleaned.split()
    merchant = ''
    for i, word in enumerate(words[:4]):
        if word and not word.isdigit() and not re.match(r'^\d+[\.\d]*$', word):
            if word[0].isupper() or (i == 0):  # First word or capitalized
                merchant += word + ' '
    if merchant.strip():
        return merchant.strip()[:50]

    return 'Unknown'


def classify_transaction(description: str, is_income: bool = False) -> str:
    """Classify transaction"""
    desc_upper = description.upper()
    
    if is_income:
        if 'CASHBACK' in desc_upper:
            return 'Cashback'
        if any(kw in desc_upper for kw in ['SALARY', 'WAGE', 'PAYROLL', 'HINDMARSH']):
            return 'Income'
        if 'TRANSFER FROM' in desc_upper:
            return 'Income'
        return 'Income'
    
    if any(kw in desc_upper for kw in ['WOOLWORTHS', 'COLES', 'ALDI', 'GROCERY', 'FOOD']):
        return 'Food'
    if any(kw in desc_upper for kw in ['BUNNINGS', 'HARDWARE', 'HOME']):
        return 'Home Improvement'
    if any(kw in desc_upper for kw in ['COSTCO', 'WHOLESALE']):
        return 'Shopping'
    if any(kw in desc_upper for kw in ['PAYPAL', 'PYPL']):
        return 'Transfer'
    if any(kw in desc_upper for kw in ['RTP', 'TRANSFER TO', 'GLOBAL TRANSFER']):
        return 'Transfer'
    if any(kw in desc_upper for kw in ['ENERGY', 'ORIGIN', 'GAS', 'ELECTRIC']):
        return 'Utilities'
    if any(kw in desc_upper for kw in ['CHEMIST', 'PHARMACY', 'HEALTH']):
        return 'Health'
    if any(kw in desc_upper for kw in ['BARBER', 'HAIR']):
        return 'Personal Care'
    if any(kw in desc_upper for kw in ['RESTAURANT', 'CAFE', 'PIZZA', 'GRILL', 'SHAWARMA']):
        return 'Dining'
    
    return 'Other'


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python hsbc_parser_v3.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    result = parse_hsbc_statement(sys.argv[1])
    print(json.dumps(result, indent=2))

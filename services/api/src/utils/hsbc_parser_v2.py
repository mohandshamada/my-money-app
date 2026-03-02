#!/usr/bin/env python3
"""
HSBC Statement Parser - PyMuPDF Version
Better text extraction for complex statement layouts
"""

import fitz  # PyMuPDF
import json
import re
import sys
from typing import List, Dict, Any, Optional


def parse_hsbc_statement(pdf_path: str) -> Dict[str, Any]:
    """
    Parse HSBC bank statement PDF using PyMuPDF
    """
    doc = fitz.open(pdf_path)
    all_lines = []
    
    for page in doc:
        text = page.get_text()
        lines = text.split('\n')
        all_lines.extend(lines)
    
    transactions = extract_hsbc_transactions_v2(all_lines)
    
    return {
        "bankName": "HSBC",
        "currency": "AUD",
        "transactions": transactions,
        "totalTransactions": len(transactions)
    }


def extract_hsbc_transactions_v2(lines: List[str]) -> List[Dict[str, Any]]:
    """
    Extract transactions using improved parsing logic
    Handles multi-line transactions where amounts are on separate lines
    """
    transactions = []
    statement_year = '2026'
    
    # Skip patterns
    skip_patterns = [
        'Statement period', 'Page ', 'Financial Statement',
        'BALANCE BROUGHT FORWARD', 'CLOSING BALANCE', 'OPENING BALANCE',
        'Details of your Accounts', 'Important Information',
        'Your Deposits', 'Your Investments', 'Your Loans', 'Net position',
        'Here', 'Check your account', 'Set up account', 'Never share',
        'Always keep', 'Choose strong', 'Remember to', 'Stop, challenge',
        'Having trouble', 'Summary of your portfolio', 'TOTAL DEPOSITS',
        'Current Debit Balance', 'Interest Rate'
    ]
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        
        # Skip header/footer lines
        if any(pattern in line for pattern in skip_patterns):
            i += 1
            continue
        
        # Skip lines that are just amounts (these are continuations)
        if re.match(r'^\s*[\d,]+\.\d{2}\s*$', line):
            i += 1
            continue
        
        # Check for main transaction date format: '19 Jan' or '30 Jan'
        main_date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', line, re.IGNORECASE)
        if main_date_match:
            # This is just a date line - move to next line for transaction details
            i += 1
            continue
        
        # Check for cashback date format: '18JAN26'
        cashback_date_match = re.search(r'(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})', line, re.IGNORECASE)
        
        # Look for amounts on this line and nearby lines
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
        
        # If no amounts on this line, look at next line
        if not amounts and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', next_line)
        
        if not amounts:
            i += 1
            continue
        
        # Find the transaction date by looking backwards
        tx_date = None
        for j in range(i-1, max(-1, i-10), -1):
            prev_line = lines[j].strip()
            # Look for DD MMM format
            date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', prev_line, re.IGNORECASE)
            if date_match:
                day = date_match.group(1)
                month = date_match.group(2).upper()
                tx_date = f'{statement_year}-{month}-{int(day):02d}'
                break
        
        if not tx_date:
            i += 1
            continue
        
        # Process each amount found
        for amt_str in amounts:
            amt = float(amt_str.replace(',', ''))
            
            # Skip if it's clearly a running balance (> $10,000)
            if amt >= 10000:
                continue
            
            # Skip very small amounts (likely partial matches)
            if amt < 0.01:
                continue
            
            # Determine if it's income or expense
            line_upper = line.upper()
            
            # HSBC specific: EFTPOS/VISA lines are expenses (debits)
            has_eftpos = 'EFTPOS' in line_upper or 'VISA' in line_upper
            has_cashback = 'CASHBACK' in line_upper
            
            if has_cashback:
                is_income = True  # Cashback is income
            elif has_eftpos:
                is_income = False  # EFTPOS/VISA are expenses
            else:
                # Check for explicit income keywords
                is_income = any(kw in line_upper for kw in [
                    'CREDIT', 'DEPOSIT', 'SALARY', 'PAYMENT IN',
                    'TRANSFER FROM', 'REFUND', 'HINDMARSH'
                ])
            
            # Extract description
            desc = line
            # Remove cashback date patterns
            if cashback_date_match:
                desc = re.sub(r'\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}', '', desc, flags=re.I)
            # Remove amounts
            for a in amounts:
                desc = desc.replace(a, '')
            # Clean up
            desc = re.sub(r'\s+', ' ', desc).strip()
            
            # Skip if description is empty or just numbers
            if not desc or desc.isdigit() or len(desc) < 2:
                desc = line
                # Try to extract meaningful text before the amount
                if amt_str in line:
                    desc = line[:line.find(amt_str)].strip()
            
            # Skip duplicate transactions
            is_duplicate = any(
                t['date'] == tx_date and 
                abs(t['amount'] - amt) < 0.01 and 
                t['description'][:30] == desc[:30]
                for t in transactions
            )
            
            if not is_duplicate and len(desc) > 2 and desc != line:
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
    """Extract merchant name from transaction description"""
    patterns = [
        r'EFTPOS VISA AUD ([^\d]{3,50})',
        r'PAYPAL AUSTRALIA',
        r'PYPL \w+',
        r'RTP [\w\s]+',
        r'GLOBAL TRANSFER \w+',
        r'TRANSFER (?:TO|FROM)',
        r'([A-Z][A-Z\s\u0026\.]+(?:PTY|LTD|LLC|INC)?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(1).strip() if match.groups() else match.group(0).strip()
    
    parts = description.split()
    return parts[0] if parts else 'Unknown'


def classify_transaction(description: str, is_income: bool = False) -> str:
    """Classify transaction into category"""
    desc_upper = description.upper()
    
    if is_income:
        if 'CASHBACK' in desc_upper:
            return 'Income'
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
        print("Usage: python hsbc_parser_v2.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    result = parse_hsbc_statement(sys.argv[1])
    print(json.dumps(result, indent=2))

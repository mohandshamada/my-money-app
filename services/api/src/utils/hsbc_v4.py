#!/usr/bin/env python3
"""
HSBC Statement Parser v4 - Two-Pass Approach
First pass: Collect all lines with context
Second pass: Identify transactions with amounts and assign dates
"""

import fitz
import json
import re
import sys
from typing import List, Dict, Any, Optional, Tuple


def parse_hsbc_statement(pdf_path: str) -> Dict[str, Any]:
    """Parse HSBC statement using PyMuPDF"""
    
    # Extract all lines with PyMuPDF
    doc = fitz.open(pdf_path)
    lines = []
    for page in doc:
        text = page.get_text()
        for line in text.split('\n'):
            line = line.strip()
            if line:
                lines.append(line)
    
    transactions = []
    current_date = None
    statement_year = '2026'
    i = 0
    
    # Skip patterns
    skip = ['Statement period', 'Page ', 'Financial Statement', 'BALANCE',
            'CLOSING BALANCE', 'OPENING BALANCE', 'Details of your Accounts',
            'Important Information', 'Your Deposits', 'Your Investments',
            'Your Loans', 'Net position', 'Here', 'Check your account',
            'Set up account', 'Never share', 'Always keep', 'Choose strong',
            'Remember to', 'Stop, challenge', 'Having trouble',
            'Summary of your portfolio', 'TOTAL DEPOSITS',
            'Current Debit Balance', 'Interest Rate', 'Transaction Total',
            'Premier Centre', 'if calling', 'Your Portfolio',
            'HSBC Bank Australia', 'ABN', 'AFSL', 'visit https',
            'Financial Complaints Authority']
    
    while i < len(lines):
        line = lines[i]
        
        # Skip header/footer
        if any(s in line for s in skip):
            i += 1
            continue
        
        # Check for date: '30 Jan', '19 Jan'
        date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', line, re.I)
        if date_match:
            day = int(date_match.group(1))
            month = date_match.group(2).upper()
            new_date = f'{statement_year}-{month}-{day:02d}'
            
            # Special case: If previous line was a non-EFTPOS transaction without a date,
            # it might belong to this new date (deposits often appear before date markers)
            if current_date and transactions:
                last_tx = transactions[-1]
                if last_tx['date'] == current_date and not ('EFTPOS' in last_tx['description'].upper() or 'VISA' in last_tx['description'].upper()):
                    # Check if the last transaction was processed recently (within last few lines)
                    # and if it looks like a deposit/income
                    if last_tx['type'] == 'credit' and 'Cashback' not in last_tx['category']:
                        # This might be a deposit that should use the new date
                        # Only update if the new date is chronologically after
                        if new_date > current_date:
                            last_tx['date'] = new_date
            
            current_date = new_date
            i += 1
            continue
        
        # Check for cashback date format - skip these
        if re.match(r'\d{1,2}(JAN|FEB)', line, re.I) and 'Cashback' not in line:
            i += 1
            continue
        
        # Look for amounts on this line
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
        
        if amounts and current_date:
            # Check if this is a standalone amount line (just amounts, no description)
            amt_only = all(re.match(r'^[\d,\.]+$', a.replace(',', '')) or a in line for a in amounts)
            
            # Get the actual transaction amounts (not running balances > 10000)
            tx_amounts = [float(a.replace(',', '')) for a in amounts if float(a.replace(',', '')) < 10000]
            
            if tx_amounts:
                # Extract description
                desc = line
                for a in amounts:
                    desc = desc.replace(a, '')
                desc = re.sub(r'\s+', ' ', desc).strip()
                
                # If description is empty, look at previous line(s)
                if len(desc) < 3:
                    # Look back for description
                    for j in range(i-1, max(-1, i-5), -1):
                        prev = lines[j]
                        # Skip if it's a date, amount, or skip pattern
                        if re.match(r'\d{1,2}\s+(Jan|Feb)', prev, re.I):
                            break
                        if re.match(r'^\s*[\d,]+\.\d{2}\s*$', prev):
                            continue
                        if any(s in prev for s in skip):
                            continue
                        if len(prev) > 3:
                            desc = prev + ' ' + desc if desc else prev
                            break
                
                desc = desc.strip()
                
                # Skip if still no valid description
                if len(desc) < 3:
                    i += 1
                    continue
                
                # Process each valid amount
                for amt in tx_amounts:
                    if amt < 0.01:
                        continue
                    
                    # Determine type
                    desc_upper = desc.upper()
                    has_eftpos = 'EFTPOS' in desc_upper or 'VISA' in desc_upper
                    has_cashback = 'CASHBACK' in desc_upper
                    
                    if has_cashback:
                        is_expense = False
                    elif has_eftpos:
                        is_expense = True
                    else:
                        is_expense = not any(kw in desc_upper for kw in [
                            'HINDMARSH', 'SALARY', 'DEPOSIT', 'CREDIT', 
                            'REFUND', 'TRANSFER FROM'
                        ])
                    
                    tx = {
                        'date': current_date,
                        'description': desc[:100],
                        'amount': amt,
                        'type': 'debit' if is_expense else 'credit',
                        'merchant': extract_merchant(desc),
                        'category': classify(desc, is_expense)
                    }
                    
                    # Check for duplicates
                    is_dup = any(t['date'] == tx['date'] and 
                                abs(t['amount'] - tx['amount']) < 0.01 and
                                t['description'][:30] == tx['description'][:30]
                                for t in transactions)
                    
                    if not is_dup:
                        transactions.append(tx)
        
        i += 1
    
    return {
        'bankName': 'HSBC',
        'currency': 'AUD',
        'transactions': transactions,
        'totalTransactions': len(transactions),
        'debits': len([t for t in transactions if t['type'] == 'debit']),
        'credits': len([t for t in transactions if t['type'] == 'credit'])
    }


def extract_merchant(desc: str) -> str:
    """Extract merchant name"""
    patterns = [
        r'EFTPOS VISA AUD ([^\d]{3,40}?)(?:\s+\d|\s+A[U$]|\s*$)',
        r'(HINDMARSH)',
        r'RTP \d+ \d+ ([^\d]+?)(?:\s+\d|$)',
        r'PYPL (\w+)',
        r'([A-Z][A-Z\s&\.]+(?:PTY|LTD)?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, desc, re.I)
        if match:
            return match.group(1).strip()
    
    return desc.split()[0] if desc else 'Unknown'


def classify(desc: str, is_expense: bool) -> str:
    """Classify transaction"""
    if not is_expense:
        return 'Cashback' if 'CASHBACK' in desc.upper() else 'Income'
    
    cats = {
        'Food': ['WOOLWORTHS', 'COLES', 'ALDI', 'GROCERY'],
        'Home': ['BUNNINGS'],
        'Shopping': ['COSTCO', 'BIG W'],
        'Transfer': ['PAYPAL', 'PYPL', 'RTP', 'TRANSFER'],
        'Utilities': ['ENERGY', 'ORIGIN'],
        'Dining': ['RESTAURANT', 'CAFE', 'GRILL'],
    }
    
    for cat, kws in cats.items():
        if any(kw in desc.upper() for kw in kws):
            return cat
    
    return 'Other'


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python hsbc_v4.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    result = parse_hsbc_statement(sys.argv[1])
    print(json.dumps(result, indent=2))

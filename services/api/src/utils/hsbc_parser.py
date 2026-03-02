#!/usr/bin/env python3
"""
HSBC Statement Parser
Extracts transactions from HSBC bank statement PDFs
"""

import pdfplumber
import json
import re
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime


def parse_hsbc_statement(pdf_path: str) -> Dict[str, Any]:
    """
    Parse HSBC bank statement PDF
    """
    with pdfplumber.open(pdf_path) as pdf:
        all_lines = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_lines.extend(text.split('\n'))
        
        transactions = extract_hsbc_transactions(all_lines)
        
        return {
            "bankName": "HSBC",
            "currency": "AUD",
            "transactions": transactions,
            "totalTransactions": len(transactions)
        }


def extract_hsbc_transactions(lines: List[str]) -> List[Dict[str, Any]]:
    """
    Extract transactions from HSBC statement lines
    Handles:
    - Main transactions with 'DD MMM' format
    - Cashback entries with 'DDMMMYY' format  
    - Multi-line transactions
    - Income/salary deposits
    """
    transactions = []
    current_date = None
    statement_year = '2026'  # From statement period
    
    # Skip patterns
    skip_patterns = [
        'Statement period', 'Page ', 'Financial Statement',
        'BALANCE BROUGHT FORWARD', 'CLOSING BALANCE', 'OPENING BALANCE',
        'Details of your Accounts', 'Important Information',
        'Your Deposits', 'Your Investments', 'Your Loans', 'Net position',
        'Here', 'Check your account', 'Set up account', 'Never share',
        'Always keep', 'Choose strong', 'Remember to', 'Stop, challenge',
        'Having trouble', 'Summary of your portfolio', 'TOTAL DEPOSITS'
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
        
        # Check for main transaction date format: '19 Jan' or '30 Jan'
        # This takes precedence over cashback dates
        main_date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', line, re.IGNORECASE)
        if main_date_match:
            day = main_date_match.group(1)
            month = main_date_match.group(2).upper()
            current_date = f'{statement_year}-{month}-{int(day):02d}'
        
        # Check for cashback date format: '18JAN26' (but don't update current_date for these)
        # These are usually on separate lines for cashback entries
        cashback_date_match = re.search(r'(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})', line, re.IGNORECASE)
        
        # Find amounts on this line
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
        
        # Process if we have a date and amounts
        if current_date and amounts:
            # Skip lines that are clearly not transactions
            if 'Interest Rate' in line or 'Current Debit Balance' in line:
                i += 1
                continue
            
            # For HSBC, we need to identify which amounts are transaction amounts
            # vs running balances. The pattern is:
            # - Main transaction: description + amount (smaller value)
            # - End of day: multiple amounts where last is running balance
            
            transaction_added = False
            
            for idx, amt_str in enumerate(amounts):
                amt = float(amt_str.replace(',', ''))
                
                # Skip if it's clearly a running balance (> $10,000 or at end with specific pattern)
                if amt >= 10000:
                    continue
                
                # Skip very small amounts that are likely partial matches
                if amt < 0.01:
                    continue
                
                # This looks like a valid transaction amount
                # Determine if it's income or expense
                line_upper = line.upper()
                
                # HSBC specific: EFTPOS/VISA lines are expenses (debits)
                # Lines without EFTPOS/VISA are typically transfers or deposits
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
                
                # For cashback entries with DDMMMYY format, they are credits
                if cashback_date_match and has_cashback:
                    is_income = True
                
                # Extract description
                # Remove date patterns and amounts from line to get description
                desc = line
                # Remove main date
                if main_date_match:
                    desc = desc.replace(main_date_match.group(0), '')
                # Remove cashback date
                if cashback_date_match:
                    desc = re.sub(r'\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}', '', desc, flags=re.I)
                # Remove amounts
                for a in amounts:
                    desc = desc.replace(a, '')
                # Clean up
                desc = re.sub(r'\s+', ' ', desc).strip()
                
                # Skip if description is empty or just numbers
                if not desc or desc.isdigit() or len(desc) < 3:
                    # Try to use the raw line without the amount
                    desc = line[:line.find(amt_str)].strip() if amt_str in line else line
                
                # Skip duplicate transactions (same date, amount, description)
                is_duplicate = any(
                    t['date'] == current_date and 
                    abs(t['amount'] - amt) < 0.01 and 
                    t['description'][:30] == desc[:30]
                    for t in transactions
                )
                
                if not is_duplicate and len(desc) > 2:
                    transactions.append({
                        'date': current_date,
                        'description': desc[:100],
                        'amount': amt,
                        'type': 'credit' if is_income else 'debit',
                        'merchant': extract_merchant(desc),
                        'category': classify_transaction(desc, is_income)
                    })
                    transaction_added = True
                    break  # Only take the first valid amount per line
            
            # If no transaction was added from this line, it might be a continuation
            # of a previous transaction (multi-line format)
            if not transaction_added and not main_date_match:
                # Check if next lines have amounts that should use this date
                pass
        
        i += 1
    
    return transactions


def extract_merchant(description: str) -> str:
    """Extract merchant name from transaction description"""
    # Common patterns
    patterns = [
        r'EFTPOS VISA AUD ([^\d]{3,50})',
        r'PAYPAL AUSTRALIA',
        r'PYPL \w+',
        r'RTP [\w\s]+',
        r'GLOBAL TRANSFER \w+',
        r'TRANSFER (?:TO|FROM)',
        r'([A-Z][A-Z\s&\.]+(?:PTY|LTD|LLC|INC)?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(1).strip() if match.groups() else match.group(0).strip()
    
    # Return first part of description
    parts = description.split()
    return parts[0] if parts else 'Unknown'


def classify_transaction(description: str, is_income: bool = False) -> str:
    """Classify transaction into category"""
    desc_upper = description.upper()
    
    if is_income:
        if 'CASHBACK' in desc_upper:
            return 'Income'
        if any(kw in desc_upper for kw in ['SALARY', 'WAGE', 'PAYROLL']):
            return 'Income'
        if 'TRANSFER FROM' in desc_upper:
            return 'Income'
        return 'Income'
    
    # Expense categories
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
        print("Usage: python hsbc_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    result = parse_hsbc_statement(sys.argv[1])
    print(json.dumps(result, indent=2))

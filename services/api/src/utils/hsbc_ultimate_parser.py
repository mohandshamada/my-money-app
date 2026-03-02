#!/usr/bin/env python3
"""
Ultimate HSBC Statement Parser
Uses PyMuPDF for best text extraction + intelligent multi-line transaction parsing
"""

import fitz  # PyMuPDF
import json
import re
import sys
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    is_expense: bool
    merchant: str = ""
    category: str = ""
    raw_lines: List[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'date': self.date,
            'description': self.description,
            'amount': self.amount,
            'type': 'debit' if self.is_expense else 'credit',
            'merchant': self.merchant,
            'category': self.category
        }


class HSBCStatementParser:
    """
    Advanced parser for HSBC bank statements
    Handles multi-line transactions, various date formats, and complex layouts
    """
    
    def __init__(self):
        self.year = '2026'  # From statement period
        self.skip_patterns = [
            'Statement period', 'Page ', 'Financial Statement',
            'BALANCE BROUGHT FORWARD', 'CLOSING BALANCE', 'OPENING BALANCE',
            'Details of your Accounts', 'Important Information',
            'Your Deposits', 'Your Investments', 'Your Loans', 'Net position',
            'Here', 'Check your account', 'Set up account', 'Never share',
            'Always keep', 'Choose strong', 'Remember to', 'Stop, challenge',
            'Having trouble', 'Summary of your portfolio', 'TOTAL DEPOSITS',
            'Current Debit Balance', 'Interest Rate', 'Transaction Total',
            'Premier Centre', 'if calling', 'Your Portfolio',
            'HSBC Bank Australia', 'ABN', 'AFSL', 'visit https'
        ]
    
    def parse(self, pdf_path: str) -> Dict[str, Any]:
        """Main parse method"""
        # Extract all text using PyMuPDF
        doc = fitz.open(pdf_path)
        all_lines = []
        
        for page_num, page in enumerate(doc):
            text = page.get_text()
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            all_lines.extend(lines)
        
        # Parse transactions
        transactions = self._extract_transactions(all_lines)
        
        return {
            'bankName': 'HSBC',
            'currency': 'AUD',
            'transactions': [t.to_dict() for t in transactions],
            'totalTransactions': len(transactions),
            'debits': len([t for t in transactions if t.is_expense]),
            'credits': len([t for t in transactions if not t.is_expense])
        }
    
    def _extract_transactions(self, lines: List[str]) -> List[Transaction]:
        """
        Extract transactions using state machine approach
        Handles multi-line transactions where:
        - Date is on a separate line
        - Description spans multiple lines  
        - Amounts are on separate lines
        """
        transactions = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # Skip header/footer lines
            if self._should_skip(line):
                i += 1
                continue
            
            # Check for date line: '30 Jan', '19 Jan'
            date_match = self._match_date(line)
            if date_match:
                # Look ahead for transaction data
                tx = self._parse_transaction_at_date(lines, i, date_match)
                if tx:
                    transactions.append(tx)
                i += 1
                continue
            
            i += 1
        
        # Remove duplicates and sort
        transactions = self._deduplicate(transactions)
        transactions.sort(key=lambda x: (x.date, x.amount), reverse=True)
        
        return transactions
    
    def _match_date(self, line: str) -> Optional[Tuple[int, str]]:
        """Match DD MMM format date"""
        match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', line, re.IGNORECASE)
        if match:
            return (int(match.group(1)), match.group(2).upper())
        return None
    
    def _parse_transaction_at_date(self, lines: List[str], date_idx: int, date_match: Tuple[int, str]) -> Optional[Transaction]:
        """
        Parse transaction starting at a date line
        Looks ahead to find description and amounts
        """
        day, month = date_match
        date_str = f'{self.year}-{month}-{day:02d}'
        
        # Collect lines until we find amounts
        description_lines = []
        amounts = []
        end_idx = date_idx + 1
        
        # Look ahead up to 5 lines for the transaction
        for j in range(date_idx + 1, min(len(lines), date_idx + 6)):
            line = lines[j]
            
            # Stop if we hit another date
            if self._match_date(line):
                break
            
            # Stop if we hit a cashback date line
            if re.match(r'\d{1,2}(JAN|FEB)', line, re.I):
                break
            
            # Check for amounts
            line_amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
            
            if line_amounts:
                # This line has amounts
                for amt_str in line_amounts:
                    amt = float(amt_str.replace(',', ''))
                    # Skip running balances (> $10,000)
                    if amt < 10000:
                        amounts.append(amt)
                
                # Extract description part (before amounts)
                desc_part = line
                for amt_str in line_amounts:
                    desc_part = desc_part.replace(amt_str, '')
                desc_part = desc_part.strip()
                if desc_part and len(desc_part) > 2:
                    description_lines.append(desc_part)
                
                end_idx = j + 1
                
                # If we found reasonable amounts, stop looking
                if amounts:
                    break
            else:
                # No amounts on this line - it's part of the description
                if not self._should_skip(line) and len(line) > 2:
                    description_lines.append(line)
        
        if not amounts or not description_lines:
            return None
        
        # Build description
        description = ' '.join(description_lines)
        description = re.sub(r'\s+', ' ', description).strip()
        
        # Use the first reasonable amount (not the running balance)
        amount = amounts[0]
        
        # Determine if expense or income
        is_expense = self._is_expense(description)
        
        # Extract merchant and category
        merchant = self._extract_merchant(description)
        category = self._classify_transaction(description, is_expense)
        
        return Transaction(
            date=date_str,
            description=description[:100],
            amount=amount,
            is_expense=is_expense,
            merchant=merchant,
            category=category,
            raw_lines=lines[date_idx:end_idx]
        )
    
    def _should_skip(self, line: str) -> bool:
        """Check if line should be skipped"""
        if any(pattern in line for pattern in self.skip_patterns):
            return True
        # Skip pure amounts (like running balances on their own line)
        if re.match(r'^\s*[\d,]+\.\d{2}\s*$', line):
            return True
        # Skip very short lines
        if len(line) < 3:
            return True
        return False
    
    def _is_expense(self, description: str) -> bool:
        """Determine if transaction is an expense (debit) or income (credit)"""
        desc_upper = description.upper()
        
        # EFTPOS/VISA are always expenses
        if 'EFTPOS' in desc_upper or 'VISA' in desc_upper:
            return True
        
        # Cashback is income (credit)
        if 'CASHBACK' in desc_upper:
            return False
        
        # Transfers TO are expenses, FROM are income
        if 'TRANSFER TO' in desc_upper:
            return True
        if 'TRANSFER FROM' in desc_upper:
            return False
        
        # RTP with NOTPROVIDED are usually outgoing transfers
        if 'RTP' in desc_upper and 'NOTPROVIDED' in desc_upper:
            return True
        
        # Default: assume expense unless keywords indicate income
        income_keywords = ['SALARY', 'DEPOSIT', 'CREDIT', 'REFUND', 'HINDMARSH', 'PAYMENT IN']
        if any(kw in desc_upper for kw in income_keywords):
            return False
        
        return True
    
    def _extract_merchant(self, description: str) -> str:
        """Extract merchant name from description"""
        patterns = [
            (r'EFTPOS VISA AUD ([^\d]{3,50}?)(?:\s+\d|\s+A[U$]|\s*$)', 1),
            (r'RTP [\w\s]+?(\w+)(?:\s+\d|$)', 1),
            (r'GLOBAL TRANSFER (\w+)', 1),
            (r'PYPL (\w+)', 1),
            (r'PAYPAL (\w+)', 1),
            (r'(HINDMARSH)', 1),
            (r'([A-Z][A-Z\s&\.]+(?:PTY|LTD|LLC|INC)?)', 1),
        ]
        
        for pattern, group in patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                result = match.group(group).strip()
                if result and len(result) > 2:
                    return result
        
        # Fallback: first word
        parts = description.split()
        return parts[0] if parts else 'Unknown'
    
    def _classify_transaction(self, description: str, is_expense: bool) -> str:
        """Classify transaction into category"""
        if not is_expense:
            if 'CASHBACK' in description.upper():
                return 'Cashback'
            return 'Income'
        
        desc_upper = description.upper()
        
        categories = {
            'Food': ['WOOLWORTHS', 'COLES', 'ALDI', 'GROCERY', 'FOOD'],
            'Home Improvement': ['BUNNINGS', 'HARDWARE'],
            'Shopping': ['COSTCO', 'WHOLESALE', 'BIG W'],
            'Transfer': ['PAYPAL', 'PYPL', 'RTP', 'TRANSFER', 'GLOBAL TRANSFER'],
            'Utilities': ['ENERGY', 'ORIGIN', 'GAS', 'ELECTRIC'],
            'Health': ['CHEMIST', 'PHARMACY'],
            'Personal Care': ['BARBER', 'HAIR'],
            'Dining': ['RESTAURANT', 'CAFE', 'PIZZA', 'GRILL', 'SHAWARMA'],
        }
        
        for category, keywords in categories.items():
            if any(kw in desc_upper for kw in keywords):
                return category
        
        return 'Other'
    
    def _deduplicate(self, transactions: List[Transaction]) -> List[Transaction]:
        """Remove duplicate transactions"""
        seen = set()
        unique = []
        
        for tx in transactions:
            key = (tx.date, round(tx.amount, 2), tx.description[:30])
            if key not in seen:
                seen.add(key)
                unique.append(tx)
        
        return unique


def main():
    if len(sys.argv) < 2:
        print("Usage: python hsbc_ultimate_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    parser = HSBCStatementParser()
    result = parser.parse(sys.argv[1])
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

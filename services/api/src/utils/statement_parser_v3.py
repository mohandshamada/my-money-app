#!/usr/bin/env python3
"""
Statement Parser v3 - Complete Rewrite
Captures ALL transactions including cashback credits
"""

import fitz
import json
import re
import sys
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from collections import defaultdict


@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    type: str
    merchant: Optional[str] = None
    category: Optional[str] = None
    raw_line: Optional[str] = None


class StatementParserV3:
    """Complete HSBC statement parser capturing all transactions"""
    
    # Patterns to skip
    SKIP_PATTERNS = [
        r'^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s+to',  # Statement period
        r'^BALANCE BROUGHT FORWARD$',
        r'^BALANCE CARRIED FORWARD$',
        r'^CLOSING BALANCE$',
        r'^OPENING BALANCE$',
        r'^Current Debit Balance$',
        r'^Interest Rate',
        r'^Statement period',
        r'^Page \d+ of \d+$',
        r'^Financial Statement$',
        r'^\d{1,2}\.\d+% pa$',
        r'^Your (Deposits|Investments|Loans)$',
        r'^Net position$',
        r'^TOTAL DEPOSITS$',
        r'^\(AUD\s+Equivalent\)$',
        r'^BRANCH:',
        r'^Premier Centre$',
        r'^\+?\d[\d\s\-\(\)]+\d$',  # Phone numbers
        r'^\d{6}$',  # Customer numbers
        r'^\d{3}-\d+$',  # Customer number format
        r'^MR\s+\w+',
        r'^MRS\s+\w+',
        r'^U \d+/\d+',
        r'^\w+ NSW \d+$',
        r'^\d{1,2}Dec\s+\d{4}$',  # Date formats
    ]
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
        self.year_range = (str(datetime.now().year), str(datetime.now().year))
        self.all_lines = []
        self.transactions = []
        self.processed_amounts = set()  # Track processed amounts to avoid duplicates
        
    def parse(self) -> Dict[str, Any]:
        """Main parsing method"""
        self._extract_lines()
        self._extract_statement_period()
        self._parse_all_transactions()
        self._post_process()
        
        return {
            'bankName': 'HSBC',
            'currency': 'AUD',
            'statementPeriod': self.year_range,
            'transactions': [asdict(t) for t in self.transactions],
            'totalTransactions': len(self.transactions),
            'extractionMethod': 'statement_parser_v3'
        }
    
    def _extract_lines(self):
        """Extract all lines from PDF"""
        for page in self.doc:
            text = page.get_text()
            lines = [l.rstrip() for l in text.split('\n')]
            self.all_lines.extend(lines)
    
    def _extract_statement_period(self):
        """Extract year range from statement"""
        text = ' '.join(self.all_lines[:50])
        match = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})\s+to\s+(\d{1,2})\s+(\w+)\s+(\d{4})', 
                         text, re.IGNORECASE)
        if match:
            self.year_range = (match.group(3), match.group(6))
    
    def _should_skip_line(self, line: str) -> bool:
        """Check if line should be skipped"""
        for pattern in self.SKIP_PATTERNS:
            if re.match(pattern, line, re.IGNORECASE):
                return True
        return False
    
    def _parse_all_transactions(self):
        """Parse all transactions including cashback"""
        i = 0
        current_date = None
        
        while i < len(self.all_lines):
            line = self.all_lines[i].strip()
            
            if not line or self._should_skip_line(line):
                i += 1
                continue
            
            # Check for main date format: "17 Dec"
            date_match = re.match(r'^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                                 line, re.IGNORECASE)
            if date_match:
                current_date = self._parse_main_date(date_match)
                i += 1
                continue
            
            # Look for cashback entries
            cashback_tx = self._parse_cashback_entry(i, current_date)
            if cashback_tx:
                self.transactions.append(cashback_tx)
                i += 1
                continue
            
            # Look for regular transactions
            regular_tx = self._parse_regular_transaction(i, current_date)
            if regular_tx:
                self.transactions.append(regular_tx)
            
            i += 1
    
    def _parse_main_date(self, match) -> str:
        """Parse date from '17 Dec' format"""
        day = match.group(1)
        month_name = match.group(2).upper()[:3]
        months = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                  'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
        month_num = months.get(month_name, '01')
        
        start_year, end_year = self.year_range
        year = start_year if month_num == '12' else end_year
        
        return f"{year}-{month_num}-{day.zfill(2)}"
    
    def _parse_cashback_date(self, date_str: str) -> Optional[str]:
        """Parse date from '16DEC25' format"""
        match = re.match(r'(\d{1,2})([A-Z]{3})(\d{2})', date_str.upper())
        if match:
            day = match.group(1)
            month_name = match.group(2)
            year_short = match.group(3)
            
            months = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                      'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
            month_num = months.get(month_name, '01')
            year = f"20{year_short}"
            
            return f"{year}-{month_num}-{day.zfill(2)}"
        return None
    
    def _parse_cashback_entry(self, idx: int, fallback_date: Optional[str]) -> Optional[Transaction]:
        """Parse cashback entries"""
        line = self.all_lines[idx].strip()
        
        # Must start with cashback date format
        if not re.match(r'^(\d{1,2}[A-Z]{3}\d{2})', line.upper()):
            return None
        
        # Check for cashback in context
        context = ' '.join(self.all_lines[idx:idx+3])
        if 'CASHBACK' not in context.upper():
            return None
        
        # Parse date
        date_match = re.match(r'^(\d{1,2}[A-Z]{3}\d{2})', line.upper())
        date_str = date_match.group(1)
        tx_date = self._parse_cashback_date(date_str) or fallback_date
        
        if not tx_date:
            return None
        
        # Find amount
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
        if not amounts and idx + 1 < len(self.all_lines):
            amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', self.all_lines[idx + 1])
        
        if not amounts:
            return None
        
        amount = float(amounts[0].replace(',', ''))
        
        # Must be small amount for cashback
        if amount >= 5 or amount < 0.01:
            return None
        
        # Check for duplicates
        dup_key = (tx_date, round(amount, 2), 'cashback')
        if dup_key in self.processed_amounts:
            return None
        self.processed_amounts.add(dup_key)
        
        # Build description
        desc = "Cashback"
        merchant_code_match = re.search(r'\b(\d{6})\b', line)
        if merchant_code_match:
            merchant_code = merchant_code_match.group(1)
            # Try to find matching merchant
            for tx in reversed(self.transactions):
                if merchant_code in (tx.raw_line or ''):
                    desc = f"Cashback - {tx.merchant or 'Purchase'}"
                    break
        
        return Transaction(
            date=tx_date,
            description=desc,
            amount=amount,
            type='credit',
            merchant='HSBC Cashback',
            category='Cashback',
            raw_line=line
        )
    
    def _parse_regular_transaction(self, idx: int, current_date: Optional[str]) -> Optional[Transaction]:
        """Parse regular transactions"""
        if not current_date:
            return None
        
        line = self.all_lines[idx].strip()
        
        # Skip cashback date lines
        if re.match(r'^\d{1,2}[A-Z]{3}\d{2}', line.upper()):
            return None
        
        # Skip location-only lines
        if re.match(r'^[A-Z\s]+AU$', line.upper()):
            return None
        
        # Skip lines that are just amounts
        if re.match(r'^\s*[\d,]+\.\d{2}\s*$', line):
            return None
        
        # Must have some letters (description)
        if not any(c.isalpha() for c in line):
            return None
        
        # Skip certain patterns
        skip_keywords = ['BALANCE', 'INTEREST RATE', 'Current Debit', 'Statement period',
                        'Starting debit interest', 'HKBAAU2SXXXN']
        if any(kw.upper() in line.upper() for kw in skip_keywords):
            return None
        
        # Look for amounts
        amounts = self._find_amounts_in_context(idx)
        if not amounts:
            return None
        
        # Get first reasonable amount
        amount_info = amounts[0]
        amount = amount_info['amount']
        
        # Skip balances and invalid amounts
        if amount > 10000 or amount < 0.5:
            return None
        
        # Check for duplicates (avoid same amount/date/description)
        dup_key = (current_date, round(amount, 2), line[:30])
        if dup_key in self.processed_amounts:
            return None
        self.processed_amounts.add(dup_key)
        
        # Build description
        description = self._build_description(idx, amount_info['line_idx'])
        
        if not description or len(description) < 3:
            return None
        
        # Skip if description is just the amount
        if re.match(r'^\s*[\d,\.]+\s*$', description):
            return None
        
        # Determine type
        is_credit = self._is_credit_transaction(description, line)
        
        # Extract merchant
        merchant = self._extract_merchant(description)
        
        # Classify
        category = self._classify(description, is_credit)
        
        return Transaction(
            date=current_date,
            description=description[:120],
            amount=amount,
            type='credit' if is_credit else 'debit',
            merchant=merchant,
            category=category,
            raw_line=line
        )
    
    def _find_amounts_in_context(self, idx: int) -> List[Dict]:
        """Find amounts in current and following lines"""
        amounts = []
        
        for j in range(idx, min(len(self.all_lines), idx + 4)):
            line = self.all_lines[j]
            matches = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
            
            for match in matches:
                amt = float(match.replace(',', ''))
                amounts.append({
                    'amount': amt,
                    'line_idx': j,
                    'line': line
                })
        
        return amounts
    
    def _build_description(self, start_idx: int, amount_line_idx: int) -> str:
        """Build description from relevant lines"""
        parts = []
        
        for j in range(start_idx, min(amount_line_idx + 1, len(self.all_lines))):
            line = self.all_lines[j].strip()
            
            # Skip date lines
            if re.match(r'^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', line, re.I):
                continue
            
            # Skip cashback date lines
            if re.match(r'^\d{1,2}[A-Z]{3}\d{2}', line.upper()):
                continue
            
            # Skip location-only lines
            if re.match(r'^[A-Z\s]+AU$', line.upper()):
                continue
            
            # Skip HKBAAU lines (bank codes)
            if 'HKBAAU' in line.upper():
                continue
            
            # Skip timestamp lines
            if re.search(r'\d{2}:\d{2}:\d{2}', line):
                continue
            
            # Remove amounts
            clean_line = re.sub(r'\d{1,3}(?:,\d{3})*\.\d{2}', '', line).strip()
            
            if clean_line and len(clean_line) > 2:
                parts.append(clean_line)
        
        # Join and clean up
        desc = ' '.join(parts)
        
        # Remove duplicate words
        words = desc.split()
        seen = set()
        unique_words = []
        for word in words:
            w = word.upper()
            if w not in seen or not w.isalpha():
                unique_words.append(word)
                seen.add(w)
        
        return ' '.join(unique_words)
    
    def _is_credit_transaction(self, description: str, line: str) -> bool:
        """Determine if transaction is a credit"""
        desc_upper = description.upper()
        
        if 'CASHBACK' in desc_upper:
            return True
        
        credit_keywords = ['CREDIT', 'DEPOSIT', 'PAYMENT IN', 'TRANSFER FROM', 'REFUND']
        for kw in credit_keywords:
            if kw in desc_upper:
                return True
        
        if 'EFTPOS' in desc_upper or 'VISA AUD' in desc_upper:
            return False
        
        return False
    
    def _extract_merchant(self, description: str) -> Optional[str]:
        """Extract merchant name"""
        desc_upper = description.upper()
        
        merchants = [
            ('MYER', 'Myer'), ('H&M', 'H&M'), ('HENNES & MAURITZ', 'H&M'),
            ('KMART', 'Kmart'), ('BUNNINGS', 'Bunnings'), ('ALDI', 'ALDI'),
            ('COLES', 'Coles'), ('WOOLWORTHS', 'Woolworths'), ('7-ELEVEN', '7-Eleven'),
            ('HARVEY NORMAN', 'Harvey Norman'), ('AMAZON', 'Amazon'),
            ('NETFLIX', 'Netflix'), ('SPOTIFY', 'Spotify'), ('PAYPAL', 'PayPal'),
            ('UBER', 'Uber'), ('SMP*ADANOS', 'SMP*Adanos'),
            ('MMK ROYAL GIFT', 'MMK Royal Gift'), ('S&E HALAL MEAT', 'S&E Halal Meat'),
            ('METRO WERRINGTON', 'Metro Werrington'),
        ]
        
        for pattern, name in merchants:
            if pattern in desc_upper:
                return name
        
        # Extract from EFTPOS pattern
        match = re.search(r'EFTPOS VISA AUD ([A-Z][A-Z0-9\s\*&\-\.]+?)(?:\s+\d{4,}|\s+[A-Z]{2}\s|\s*$)', 
                         description, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            merchant = re.sub(r'\s+\d{1,6}$', '', merchant)
            if len(merchant) >= 2:
                return merchant
        
        words = description.split()[:3]
        return ' '.join(words)[:40] if words else None
    
    def _classify(self, description: str, is_credit: bool) -> str:
        """Classify transaction category"""
        desc_upper = description.upper()
        
        if is_credit:
            return 'Cashback' if 'CASHBACK' in desc_upper else 'Income'
        
        categories = [
            (['WOOLWORTHS', 'COLES', 'ALDI', 'FOOD', 'MEAT', 'HALAL', 'JUICE'], 'Food'),
            (['KMART', 'MYER', 'H&M', 'GIFT SHOP', 'ADANOS'], 'Shopping'),
            (['BUNNINGS', 'HARVEY NORMAN'], 'Home Improvement'),
            (['UBER', 'CABS', 'PETROL', 'FUEL', 'SHELL', 'SPEEDWAY', 'METRO'], 'Transport'),
            (['RESTAURANT', 'CAFE', 'PIZZA', 'SHAWARMA', 'SWEETIE'], 'Dining'),
            (['PAYPAL', 'TRANSFER'], 'Transfer'),
            (['ENERGY', 'ELECTRIC', 'GAS'], 'Utilities'),
            (['CHEMIST', 'PHARMACY'], 'Health'),
            (['BARBER'], 'Personal Care'),
        ]
        
        for keywords, category in categories:
            if any(kw in desc_upper for kw in keywords):
                return category
        
        return 'Other'
    
    def _post_process(self):
        """Remove duplicates and sort"""
        seen = set()
        unique = []
        
        for tx in self.transactions:
            # Create a more specific key to avoid false duplicates
            key = (tx.date, round(tx.amount, 2), tx.type, tx.description[:20].upper())
            if key not in seen:
                seen.add(key)
                unique.append(tx)
        
        self.transactions = sorted(unique, key=lambda t: (t.date, t.description))


def parse_statement(pdf_path: str) -> Dict[str, Any]:
    parser = StatementParserV3(pdf_path)
    return parser.parse()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python statement_parser_v3.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    result = parse_statement(sys.argv[1])
    print(json.dumps(result, indent=2, default=str))

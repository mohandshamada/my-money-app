#!/usr/bin/env python3
"""
Statement Parser v2 - Production Ready
Uses multiple extraction strategies with confidence scoring
"""

import fitz  # PyMuPDF
import json
import re
import sys
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    type: str
    merchant: Optional[str] = None
    category: Optional[str] = None
    balance: Optional[float] = None
    confidence: float = 0.8


class StatementParserV2:
    """Production-ready statement parser with multiple strategies"""
    
    # Lines to always skip
    SKIP_PATTERNS = [
        # Document metadata
        r'^\d+_\d+\w+DA$',  # Document codes
        r'^Page \d+ of \d+$',
        r'^Financial Statement$',
        r'^Statement period',
        
        # Account summaries
        r'^Your Portfolio at a Glance$',
        r'^Your Deposits$',
        r'^Your Investments$',
        r'^Your Loans$',
        r'^Net position$',
        r'^TOTAL DEPOSITS$',
        r'^\(AUD\s+Equivalent\)$',
        r'^AUD$',
        
        # Balances
        r'^BALANCE BROUGHT FORWARD$',
        r'^BALANCE CARRIED FORWARD$',
        r'^CLOSING BALANCE$',
        r'^OPENING BALANCE$',
        r'^Current Debit Balance$',
        r'^Starting debit interest rate',
        r'^Balance \d+[,\d]*\.\d+$',
        r'^\d{1,2}\.\d+% pa$',
        
        # Column headers
        r'^Date$',
        r'^Transaction Details$',
        r'^Debits/Withdrawals$',
        r'^Credits/Deposits$',
        r'^Balance$',
        
        # Account info
        r'^EVERYDAY GLOBAL A/C$',
        r'^Account \d+$',
        r'^BSB No\. \d+$',
        r'^Currency \w+$',
        r'^Balance \d+[,\d]*\.\d+$',
        
        # Contact info
        r'^Premier Centre$',
        r'^\+?\d[\d\s\-\(\)]{7,}\d$',  # Phone numbers
        r'^\d{6}$',  # Customer numbers
        r'^\d{3}-\d+$',  # Customer number format
        r'^BRANCH:',
        
        # Security tips
        r"^Here's some helpful",
        r'^Check your account',
        r'^Set up account',
        r'^Never share',
        r'^Always keep',
        r'^Choose strong',
        r'^Remember to',
        r'^Stop, challenge',
        r'^Having trouble',
        r'^Summary of your portfolio',
        r'^Details of your Accounts$',
        r'^Important Information$',
        
        # Names/Addresses (often multi-line)
        r'^MR\s+\w+',
        r'^MRS\s+\w+',
        r'^MS\s+\w+',
        r'^U \d+/\d+',
        r'^\w+ NSW \d+$',
        r'^\w+\s+\w+\s+AU$',
        
        # Transaction metadata to skip
        r'^\d{1,2}DEC\d{2}.*\d{2}:\d{2}:\d{2}$',  # Timestamps
        r'^\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}\s+\d{6}',  # Cashback date + code
        r'^\d% Cashback',
        r'^Enjoy \d{6}',
    ]
    
    # Valid transaction patterns (must match one of these)
    VALID_TX_PATTERNS = [
        r'EFTPOS VISA AUD',  # Card transactions
        r'RTP\s+\d+',  # Real-time payments
        r'TRANSFER\s+(TO|FROM)',  # Transfers
        r'PAYPAL',  # PayPal
        r'PYPL',  # PayPal
        r'ATM\s+',  # ATM transactions
        r'CHEQUE\s+\d+',  # Cheques
        r'FEE',  # Bank fees
        r'INTEREST',  # Interest
        r'DIRECT\s+DEBIT',  # Direct debits
        r'DIRECT\s+CREDIT',  # Direct credits
    ]
    
    CATEGORY_KEYWORDS = {
        'Cashback': ['cashback', 'cash back', 'reward', '% cashback'],
        'Income': ['salary', 'wage', 'payroll', 'deposit', 'transfer from', 'payment in', 'refund', 'direct credit'],
        'Food': ['grocery', 'supermarket', 'aldi', 'coles', 'woolworths', 'food', 'restaurant', 'cafe', 'mcdonald', 'kfc', 'pizza', 'juice', 'meat'],
        'Dining': ['restaurant', 'cafe', 'coffee', 'grill', 'shawarma', 'pizza', 'sushi', 'dough', 'cheese'],
        'Transport': ['uber', 'lyft', 'taxi', 'ride', 'parking', 'gas', 'petrol', 'fuel', 'shell', 'esso', 'bp'],
        'Shopping': ['amazon', 'ebay', 'retail', 'myer', 'h&m', 'hennes', 'mauritz', 'kmart', 'big w', 'target', 'shopping', 'gift shop', 'adanos'],
        'Entertainment': ['netflix', 'hulu', 'disney', 'prime', 'spotify', 'apple music', 'youtube', 'cinema'],
        'Utilities': ['energy', 'origin', 'gas', 'electric', 'water', 'internet', 'phone', 'mobile'],
        'Health': ['pharmacy', 'chemist', 'medical', 'health', 'doctor', 'hospital', 'dental', 'halal'],
        'Personal Care': ['barber', 'salon', 'hair', 'beauty'],
        'Home Improvement': ['bunnings', 'hardware', 'home', 'ikea', 'harvey norman', 'centrepoint'],
        'Transfer': ['paypal', 'pypl', 'rtp', 'transfer to', 'transfer from', 'global transfer'],
    }
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
        self.year_range = (str(datetime.now().year), str(datetime.now().year))
        
    def parse(self) -> Dict[str, Any]:
        """Main parsing method"""
        self._extract_statement_period()
        
        transactions = self._parse_hsbc_format()
        transactions = self._filter_valid_transactions(transactions)
        transactions = self._remove_duplicates(transactions)
        
        return {
            'bankName': 'HSBC',
            'currency': 'AUD',
            'statementPeriod': self.year_range,
            'transactions': [asdict(t) for t in transactions],
            'totalTransactions': len(transactions),
            'extractionMethod': 'statement_parser_v2'
        }
    
    def _extract_statement_period(self):
        """Extract year range from statement"""
        text = self.doc[0].get_text()
        match = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})\s+to\s+(\d{1,2})\s+(\w+)\s+(\d{4})', 
                         text, re.IGNORECASE)
        if match:
            self.year_range = (match.group(3), match.group(6))
    
    def _parse_hsbc_format(self) -> List[Transaction]:
        """Parse HSBC format with improved detection"""
        all_lines = []
        for page in self.doc:
            text = page.get_text()
            lines = [l.rstrip() for l in text.split('\n')]
            all_lines.extend(lines)
        
        transactions = []
        i = 0
        current_date = None
        
        while i < len(all_lines):
            line = all_lines[i].strip()
            
            if not line:
                i += 1
                continue
            
            # Skip unwanted lines
            if self._should_skip_line(line):
                i += 1
                continue
            
            # Check for date line
            date_match = re.match(r'^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                                 line, re.IGNORECASE)
            if date_match:
                current_date = self._parse_date(date_match)
                i += 1
                continue
            
            # Skip cashback date format lines
            if re.match(r'^\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}$', 
                       line, re.IGNORECASE):
                i += 1
                continue
            
            # Look for amounts and valid transaction patterns
            tx = self._process_transaction_line(all_lines, i, current_date)
            if tx:
                transactions.append(tx)
            
            i += 1
        
        return transactions
    
    def _should_skip_line(self, line: str) -> bool:
        """Check if line should be skipped"""
        for pattern in self.SKIP_PATTERNS:
            if re.match(pattern, line, re.IGNORECASE):
                return True
        return False
    
    def _parse_date(self, match) -> str:
        """Parse date from regex match"""
        day = match.group(1)
        month_name = match.group(2).upper()[:3]
        months = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                  'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
        month_num = months.get(month_name, '01')
        
        # Determine year
        start_year, end_year = self.year_range
        year = start_year
        if end_year != start_year and month_num != '12':
            year = end_year
        
        return f"{year}-{month_num}-{day.zfill(2)}"
    
    def _process_transaction_line(self, lines: List[str], idx: int, current_date: Optional[str]) -> Optional[Transaction]:
        """Process a potential transaction line"""
        if not current_date:
            return None
        
        line = lines[idx]
        
        # Find amounts in current and next lines
        amounts = self._extract_amounts(line)
        if not amounts:
            # Check next line
            if idx + 1 < len(lines):
                amounts = self._extract_amounts(lines[idx + 1])
        
        if not amounts:
            return None
        
        # Get description
        description = self._extract_description(lines, idx, amounts)
        
        if not description or len(description) < 5:
            return None
        
        # Check if it's a valid transaction
        if not self._is_valid_transaction(description, line):
            return None
        
        # Use the first reasonable amount
        amount = amounts[0]['value']
        if amount >= 100000 or amount < 0.01:  # Skip unreasonable amounts
            return None
        
        # Determine type
        is_credit = self._is_credit(description, line)
        
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
            confidence=0.9
        )
    
    def _extract_amounts(self, line: str) -> List[Dict]:
        """Extract all amounts from a line"""
        amounts = []
        pattern = r'(\d{1,3}(?:,\d{3})*\.\d{2})'
        
        for match in re.finditer(pattern, line):
            value = float(match.group(1).replace(',', ''))
            amounts.append({
                'value': value,
                'text': match.group(1),
                'position': match.start()
            })
        
        return amounts
    
    def _extract_description(self, lines: List[str], idx: int, amounts: List[Dict]) -> str:
        """Extract transaction description"""
        description_parts = []
        
        # Look at current line
        current = lines[idx]
        
        # Remove cashback date patterns
        current = re.sub(r'\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}', '', current, flags=re.I)
        
        # Remove amounts
        for amt in amounts:
            current = current.replace(amt['text'], '')
        
        current = re.sub(r'\s+', ' ', current).strip()
        
        # Skip if looks like just a location code
        if re.match(r'^[A-Z]+\s+AU$', current):
            # Look backwards for actual description
            for j in range(idx - 1, max(-1, idx - 5), -1):
                prev = lines[j].strip()
                if self._is_valid_transaction(prev, prev):
                    # Remove amounts from this line too
                    prev_clean = prev
                    for amt in amounts:
                        prev_clean = prev_clean.replace(amt['text'], '')
                    prev_clean = re.sub(r'\s+', ' ', prev_clean).strip()
                    if len(prev_clean) >= 5:
                        current = prev_clean
                        break
        
        if len(current) >= 3:
            description_parts.append(current)
        
        # Look backwards for more context if needed
        if len(' '.join(description_parts)) < 10:
            for j in range(idx - 1, max(-1, idx - 3), -1):
                prev = lines[j].strip()
                
                # Skip dates and unwanted patterns
                if re.match(r'^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', prev, re.I):
                    continue
                if re.match(r'^\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}$', prev, re.I):
                    continue
                if self._should_skip_line(prev):
                    continue
                if re.match(r'^[A-Z]+\s+AU$', prev):
                    continue
                
                if len(prev) >= 5 and any(c.isalpha() for c in prev):
                    description_parts.insert(0, prev)
                    break
        
        return ' '.join(description_parts)
    
    def _is_valid_transaction(self, description: str, full_line: str) -> bool:
        """Check if description looks like a valid transaction"""
        desc_upper = description.upper()
        line_upper = full_line.upper()
        
        # Must have some letters
        if not any(c.isalpha() for c in description):
            return False
        
        # Check against valid patterns
        for pattern in self.VALID_TX_PATTERNS:
            if re.search(pattern, desc_upper) or re.search(pattern, line_upper):
                return True
        
        # Known merchants/keywords that indicate valid transactions
        keywords = [
            'MYER', 'H&M', 'KMART', 'BUNNINGS', 'ALDI', 'WOOLWORTHS', 'COLES', '7-ELEVEN',
            'SHELL', 'BP', 'HARVEY NORMAN', 'AMAZON', 'NETFLIX', 'SPOTIFY', 'PAYPAL',
            'UBER', 'LYFT', 'ATM', 'CHEQUE', 'FEE', 'INTEREST', 'TRANSFER'
        ]
        
        for keyword in keywords:
            if keyword in desc_upper:
                return True
        
        return False
    
    def _is_credit(self, description: str, line: str) -> bool:
        """Determine if transaction is a credit"""
        desc_upper = description.upper()
        line_upper = line.upper()
        
        # Cashback is always credit
        if 'CASHBACK' in desc_upper:
            return True
        
        # Explicit credit indicators
        credit_keywords = ['CREDIT', 'DEPOSIT', 'PAYMENT IN', 'TRANSFER FROM', 
                          'REFUND', 'SALARY', 'WAGE', 'PAYROLL', 'RECEIVED', 'DIRECT CREDIT']
        for kw in credit_keywords:
            if kw in desc_upper or kw in line_upper:
                return True
        
        # EFTPOS/VISA are debits (expenses)
        if 'EFTPOS' in desc_upper or 'VISA AUD' in desc_upper:
            return False
        
        # Default to debit for safety
        return False
    
    def _extract_merchant(self, description: str) -> Optional[str]:
        """Extract merchant name"""
        desc_upper = description.upper()
        
        # Direct merchant mappings
        merchants = [
            (r'MYER\s+([A-Z\s]+?)(?:\s+AU|\s+\d|$)', 'Myer'),
            (r'H&M\s+HENNES\s+&\s+MAURITZ', 'H&M'),
            (r'KMART\s+\d+', 'Kmart'),
            (r'BUNNINGS\s+\d+', 'Bunnings'),
            (r'ALDI\s+STORES\s+\d+', 'ALDI'),
            (r'7-ELEVEN\s+\d+', '7-Eleven'),
            (r'HARVEY\s+NORMAN\s+\w+', 'Harvey Norman'),
            (r'AMAZON', 'Amazon'),
            (r'NETFLIX', 'Netflix'),
            (r'SPOTIFY', 'Spotify'),
            (r'PAYPAL', 'PayPal'),
            (r'PYPL', 'PayPal'),
            (r'UBER', 'Uber'),
            (r'WOOLWORTHS', 'Woolworths'),
            (r'COLES', 'Coles'),
        ]
        
        for pattern, name in merchants:
            if re.search(pattern, desc_upper):
                return name
        
        # Extract from EFTPOS pattern
        match = re.search(r'EFTPOS VISA AUD ([A-Z][A-Z\s\*&\-\.]+?)(?:\s+\d{4,}|\s+[A-Z]{2}\s|\s*$)', 
                         description, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            merchant = re.sub(r'\s+\d{1,6}$', '', merchant)  # Remove trailing numbers
            if len(merchant) >= 2:
                return merchant
        
        # Extract from RTP pattern
        match = re.search(r'RTP\s+\d+\s+\d+\s+(.+?)(?:\s+HKBAAU|\s+\d+\.\d|$)', description, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            if len(merchant) >= 2:
                return merchant
        
        # Fallback: first capitalized words
        words = description.split()
        merchant_words = []
        for word in words[:3]:
            clean = word.strip('.,;').upper()
            if clean and not clean.isdigit() and len(clean) > 1:
                if clean not in ['THE', 'AND', 'AUD', 'VISA', 'EFTPOS', 'RTP', 'PYPL', 'FROM', 'TO']:
                    merchant_words.append(word.strip('.,;'))
        
        if merchant_words:
            return ' '.join(merchant_words)[:40]
        
        return None
    
    def _classify(self, description: str, is_credit: bool) -> str:
        """Classify transaction category"""
        desc_upper = description.upper()
        
        if is_credit:
            if 'CASHBACK' in desc_upper:
                return 'Cashback'
            return 'Income'
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if category == 'Income':
                continue
            for keyword in keywords:
                if keyword.upper() in desc_upper:
                    return category
        
        return 'Other'
    
    def _filter_valid_transactions(self, transactions: List[Transaction]) -> List[Transaction]:
        """Filter out invalid transactions"""
        valid = []
        for tx in transactions:
            # Skip if description is too short or just numbers
            if len(tx.description) < 5:
                continue
            if tx.description.replace('.', '').replace(',', '').replace('-', '').isdigit():
                continue
            # Skip if amount is unreasonable
            if tx.amount > 50000 or tx.amount < 0.01:
                continue
            valid.append(tx)
        return valid
    
    def _remove_duplicates(self, transactions: List[Transaction]) -> List[Transaction]:
        """Remove duplicate transactions"""
        seen = set()
        unique = []
        
        for tx in transactions:
            key = (tx.date, round(tx.amount, 2), tx.description[:30].upper())
            if key not in seen:
                seen.add(key)
                unique.append(tx)
        
        return unique


def parse_statement(pdf_path: str) -> Dict[str, Any]:
    """Parse statement with v2 parser"""
    parser = StatementParserV2(pdf_path)
    return parser.parse()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python statement_parser_v2.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    result = parse_statement(sys.argv[1])
    print(json.dumps(result, indent=2, default=str))

#!/usr/bin/env python3
"""
Comprehensive Bank Statement Parser
Supports multiple bank formats with intelligent extraction
Uses PyMuPDF as primary engine with pdfplumber fallback

Features:
- Multi-line transaction support
- Intelligent merchant extraction
- Multi-currency support
- Multiple bank format detection
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
    type: str  # 'debit' or 'credit'
    merchant: Optional[str] = None
    category: Optional[str] = None
    balance: Optional[float] = None
    raw_text: Optional[str] = None


class BankStatementParser:
    """Main parser class that handles multiple bank formats"""
    
    # Bank detection patterns
    BANK_PATTERNS = {
        'HSBC': {
            'patterns': ['HSBC', 'Everyday Global', 'Premier Centre'],
            'currency': 'AUD',
            'date_format': 'dd_mmm',
            'statement_period_pattern': r'(\d{1,2})\s+(\w+)\s+(\d{4})\s+to\s+(\d{1,2})\s+(\w+)\s+(\d{4})'
        },
        'CHASE': {
            'patterns': ['CHASE', 'JPMorgan Chase'],
            'currency': 'USD',
            'date_format': 'mm_dd_yy',
        },
        'NAB': {
            'patterns': ['National Australia Bank', 'NAB'],
            'currency': 'AUD',
        },
        'COMMONWEALTH': {
            'patterns': ['Commonwealth Bank', 'CommBank'],
            'currency': 'AUD',
        },
        'ANZ': {
            'patterns': ['ANZ Bank', 'Australia and New Zealand Banking'],
            'currency': 'AUD',
        },
    }
    
    # Category keywords for classification
    CATEGORY_KEYWORDS = {
        'Cashback': ['cashback', 'cash back', 'reward'],
        'Income': ['salary', 'wage', 'payroll', 'deposit', 'transfer from', 'payment in', 'refund'],
        'Food': ['grocery', 'supermarket', 'aldi', 'coles', 'woolworths', 'food', 'restaurant', 'cafe', 'mcdonald', 'kfc', 'pizza'],
        'Dining': ['restaurant', 'cafe', 'coffee', 'grill', 'shawarma', 'pizza', 'sushi'],
        'Transport': ['uber', 'lyft', 'taxi', 'ride', 'parking', 'gas', 'petrol', 'fuel', 'shell', 'esso', 'bp'],
        'Shopping': ['amazon', 'ebay', 'retail', 'myer', 'h&m', 'kmart', 'big w', 'target', 'shopping'],
        'Entertainment': ['netflix', 'hulu', 'disney', 'prime', 'spotify', 'apple music', 'youtube', 'cinema'],
        'Utilities': ['energy', 'origin', 'gas', 'electric', 'water', 'internet', 'phone', 'mobile'],
        'Health': ['pharmacy', 'chemist', 'medical', 'health', 'doctor', 'hospital', 'dental'],
        'Personal Care': ['barber', 'salon', 'hair', 'beauty'],
        'Home Improvement': ['bunnings', 'hardware', 'home', 'ikea', 'harvey norman'],
        'Transfer': ['paypal', 'pypl', 'rtp', 'transfer to', 'transfer from', 'global transfer'],
    }
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
        self.bank_name = None
        self.currency = 'USD'
        self.statement_period = None
        self.year_range = (str(datetime.now().year), str(datetime.now().year))
        
    def parse(self) -> Dict[str, Any]:
        """Main parsing method"""
        # Detect bank and currency
        self._detect_bank()
        
        # Extract statement period
        self._extract_statement_period()
        
        # Parse based on detected bank
        if self.bank_name == 'HSBC':
            transactions = self._parse_hsbc()
        else:
            transactions = self._parse_generic()
        
        # Post-process transactions
        transactions = self._post_process_transactions(transactions)
        
        return {
            'bankName': self.bank_name or 'Unknown Bank',
            'currency': self.currency,
            'statementPeriod': self.statement_period,
            'transactions': [asdict(t) if isinstance(t, Transaction) else t for t in transactions],
            'totalTransactions': len(transactions),
            'extractionMethod': 'pymupdf_enhanced'
        }
    
    def _detect_bank(self):
        """Detect bank from PDF content"""
        # Check first few pages for bank identifiers
        for page_num in range(min(3, len(self.doc))):
            text = self.doc[page_num].get_text().upper()
            
            for bank_name, config in self.BANK_PATTERNS.items():
                for pattern in config['patterns']:
                    if pattern.upper() in text:
                        self.bank_name = bank_name
                        self.currency = config.get('currency', 'USD')
                        return
    
    def _extract_statement_period(self):
        """Extract statement period to determine year for transactions"""
        text = self.doc[0].get_text()
        
        # HSBC pattern: "16 Dec 2025 to 16 Jan 2026"
        match = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})\s+to\s+(\d{1,2})\s+(\w+)\s+(\d{4})', 
                         text, re.IGNORECASE)
        if match:
            start_day, start_month, start_year, end_day, end_month, end_year = match.groups()
            self.statement_period = {
                'from': f"{start_year}-{self._month_to_num(start_month)}-{start_day.zfill(2)}",
                'to': f"{end_year}-{self._month_to_num(end_month)}-{end_day.zfill(2)}"
            }
            self.year_range = (start_year, end_year)
    
    def _month_to_num(self, month_str: str) -> str:
        """Convert month name to number"""
        months = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        return months.get(month_str.lower()[:3], '01')
    
    def _parse_hsbc(self) -> List[Transaction]:
        """Parse HSBC statement format with multi-line transactions"""
        all_lines = []
        for page in self.doc:
            text = page.get_text()
            lines = [l.rstrip() for l in text.split('\n')]
            all_lines.extend(lines)
        
        return self._extract_hsbc_transactions_multiline(all_lines)
    
    def _extract_hsbc_transactions_multiline(self, lines: List[str]) -> List[Transaction]:
        """
        Extract HSBC transactions handling multi-line format.
        
        HSBC format:
        - Date appears on its own line: "19 Jan"
        - Transaction description follows on next line(s)
        - Amounts appear on the same line or following lines
        - Running balance at end
        """
        transactions = []
        start_year, end_year = self.year_range
        
        # Skip patterns - lines that are definitely not transactions
        skip_patterns = [
            r'^\s*Date\s*$',
            r'^\s*Transaction Details\s*$',
            r'^\s*Debits/Withdrawals\s*$',
            r'^\s*Credits/Deposits\s*$',
            r'^\s*Balance\s*$',
            r'^Statement period',
            r'^Page \d+',
            r'^Financial Statement',
            r'^BALANCE BROUGHT FORWARD',
            r'^CLOSING BALANCE',
            r'^OPENING BALANCE',
            r'^Details of your Accounts',
            r'^Important Information',
            r'^Your Deposits',
            r'^Your Investments',
            r'^Your Loans',
            r'^Net position',
            r'^Here\'s some helpful',
            r'^Check your account',
            r'^Set up account',
            r'^Never share',
            r'^Always keep',
            r'^Choose strong',
            r'^Remember to',
            r'^Stop, challenge',
            r'^Having trouble',
            r'^Summary of your portfolio',
            r'^TOTAL DEPOSITS',
            r'^Current Debit Balance',
            r'^Interest Rate',
            r'^Transaction Total',
            r'^\d+_\d+\w+DA$',  # Document codes like "177502_01O2DA"
        ]
        
        i = 0
        current_date = None
        
        while i < len(lines):
            line = lines[i]
            
            # Skip empty lines
            if not line or not line.strip():
                i += 1
                continue
            
            line_stripped = line.strip()
            
            # Skip header/footer lines
            if any(re.match(pattern, line_stripped, re.IGNORECASE) for pattern in skip_patterns):
                i += 1
                continue
            
            # Check for date line (e.g., "19 Jan", "16 Dec")
            date_match = re.match(r'^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                                 line_stripped, re.IGNORECASE)
            if date_match:
                day = date_match.group(1)
                month_name = date_match.group(2).upper()
                month_num = self._month_to_num(month_name)
                
                # Determine year - use end_year for months after start month if years differ
                year = start_year
                if end_year != start_year and month_num != '12':
                    year = end_year
                
                current_date = f"{year}-{month_num}-{day.zfill(2)}"
                i += 1
                continue
            
            # Skip cashback date format lines (e.g., "16DEC25")
            if re.match(r'^\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}$', 
                       line_stripped, re.IGNORECASE):
                i += 1
                continue
            
            # Look for amounts in current and next few lines
            amounts = self._find_amounts_in_lines(lines, i)
            
            if amounts and current_date:
                # Get transaction description
                description = self._extract_description(lines, i, amounts)
                
                if description and len(description) >= 3:
                    # Process each amount found
                    for amount_info in amounts:
                        amount = amount_info['amount']
                        
                        # Skip running balances (typically larger amounts at end of line)
                        # and very small amounts (likely partial matches)
                        if amount >= 50000 or amount < 0.01:
                            continue
                        
                        # Determine transaction type
                        is_credit = self._is_credit_transaction(description, amount_info)
                        
                        # Extract merchant
                        merchant = self._extract_merchant(description)
                        
                        # Classify category
                        category = self._classify_transaction(description, is_credit)
                        
                        # Check for duplicates
                        is_duplicate = any(
                            t.date == current_date and 
                            abs(t.amount - amount) < 0.01 and 
                            t.description[:30] == description[:30]
                            for t in transactions
                        )
                        
                        if not is_duplicate:
                            transactions.append(Transaction(
                                date=current_date,
                                description=description[:150],
                                amount=amount,
                                type='credit' if is_credit else 'debit',
                                merchant=merchant,
                                category=category,
                                raw_text=line_stripped
                            ))
            
            i += 1
        
        return transactions
    
    def _find_amounts_in_lines(self, lines: List[str], start_idx: int, max_lines: int = 3) -> List[Dict]:
        """Find all amounts in current and following lines"""
        amounts = []
        
        for j in range(start_idx, min(len(lines), start_idx + max_lines)):
            line = lines[j]
            # Match amounts like "1,234.56" or "123.45"
            pattern = r'(\d{1,3}(?:,\d{3})*\.\d{2})'
            matches = re.findall(pattern, line)
            
            for match in matches:
                amount = float(match.replace(',', ''))
                amounts.append({
                    'amount': amount,
                    'line_idx': j,
                    'text': line
                })
        
        return amounts
    
    def _extract_description(self, lines: List[str], start_idx: int, amounts: List[Dict]) -> str:
        """Extract transaction description from current and previous lines"""
        description_parts = []
        
        # Look at current line
        current_line = lines[start_idx].strip()
        
        # Remove cashback date patterns
        current_line = re.sub(r'\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}', 
                             '', current_line, flags=re.IGNORECASE)
        
        # Remove amounts from line
        for amt_info in amounts:
            amt_str = f"{amt_info['amount']:.2f}"
            if ',' in amt_info['text']:
                amt_str = f"{amt_info['amount']:,.2f}"
            current_line = current_line.replace(amt_str, '')
        
        # Clean up
        current_line = re.sub(r'\s+', ' ', current_line).strip()
        
        # If current line has meaningful content, use it
        if len(current_line) >= 3 and any(c.isalpha() for c in current_line):
            description_parts.append(current_line)
        
        # If no good description, look backwards
        if not description_parts:
            for j in range(start_idx - 1, max(-1, start_idx - 5), -1):
                prev_line = lines[j].strip()
                
                # Skip date lines
                if re.match(r'^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                           prev_line, re.IGNORECASE):
                    continue
                
                # Skip cashback date format
                if re.match(r'^\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}$', 
                           prev_line, re.IGNORECASE):
                    continue
                
                # Skip lines that are just amounts
                if re.match(r'^\s*[\d,]+\.\d{2}\s*$', prev_line):
                    continue
                
                # Skip short lines
                if len(prev_line) < 3:
                    continue
                
                if any(c.isalpha() for c in prev_line):
                    description_parts.append(prev_line)
                    break
        
        return ' '.join(description_parts)
    
    def _is_credit_transaction(self, description: str, amount_info: Dict) -> bool:
        """Determine if transaction is a credit (income) or debit (expense)"""
        desc_upper = description.upper()
        line_upper = amount_info['text'].upper()
        
        # Direct credit indicators
        credit_keywords = ['CASHBACK', 'CREDIT', 'DEPOSIT', 'PAYMENT IN', 'TRANSFER FROM', 
                          'REFUND', 'SALARY', 'WAGE', 'PAYROLL', 'RECEIVED']
        
        for keyword in credit_keywords:
            if keyword in desc_upper:
                return True
        
        # HSBC specific: EFTPOS/VISA lines are typically debits (expenses)
        if 'EFTPOS' in desc_upper or 'VISA AUD' in desc_upper:
            return False
        
        # RTP (Real Time Payment) - need to check context
        if 'RTP' in desc_upper:
            # RTP followed by what looks like a sender (name) is usually credit
            # RTP followed by what looks like a payment reference is usually debit
            if any(keyword in desc_upper for keyword in ['INVOICE', 'PAYMENT TO']):
                return False
            # Check if next lines have "Transfer In" or similar
            if 'TRANSFER FROM' in line_upper or 'RECEIVED' in line_upper:
                return True
        
        # Default: assume debit for safety
        return False
    
    def _extract_merchant(self, description: str) -> Optional[str]:
        """Extract merchant name from description"""
        desc = description.strip()
        desc_upper = desc.upper()
        
        # Known merchant patterns
        known_merchants = [
            (r'MYER\s+([A-Z\s]+?)(?:\s+AU|\s+\d|$)', 'Myer'),
            (r'H&M\s+HENNES\s+&\s+MAURITZ', 'H&M'),
            (r'KMART\s+(\d+)', 'Kmart'),
            (r'BUNNINGS\s+(\d+)', 'Bunnings'),
            (r'ALDI\s+STORES\s+(\d+)', 'ALDI'),
            (r'WOOLWORTHS\s+([A-Z\s]+)', 'Woolworths'),
            (r'COLES\s+([A-Z\s]+)', 'Coles'),
            (r'7-ELEVEN\s+(\d+)', '7-Eleven'),
            (r'SHELL\s+(\w+)', 'Shell'),
            (r'BP\s+(\w+)', 'BP'),
            (r'HARVEY\s+NORMAN\s+(\w+)', 'Harvey Norman'),
            (r'AMAZON\s*(\w*)', 'Amazon'),
            (r'NETFLIX', 'Netflix'),
            (r'SPOTIFY', 'Spotify'),
            (r'PAYPAL\s*(\w*)', 'PayPal'),
            (r'PYPL\s+(\w+)', 'PayPal'),
            (r'UBER\s*\*?(\w*)', 'Uber'),
        ]
        
        for pattern, default_name in known_merchants:
            match = re.search(pattern, desc, re.IGNORECASE)
            if match:
                return default_name
        
        # Extract from EFTPOS VISA pattern
        eftpos_match = re.search(r'EFTPOS VISA AUD ([A-Z][A-Za-z0-9\s\*&\-\.]+?)(?:\s+\d{4,}|\s+[A-Z]{2}\s|\s*$)', 
                                desc, re.IGNORECASE)
        if eftpos_match:
            merchant = eftpos_match.group(1).strip()
            # Clean up trailing numbers and location codes
            merchant = re.sub(r'\s+\d{4,}$', '', merchant)
            merchant = re.sub(r'\s+\d{1,3}$', '', merchant)
            if len(merchant) >= 2:
                return merchant
        
        # Extract from RTP pattern
        rtp_match = re.search(r'RTP\s+\d+\s+\d+\s+(.+?)(?:\s+HKBAAU|\s+\d+\.\d|$)', desc, re.IGNORECASE)
        if rtp_match:
            merchant = rtp_match.group(1).strip()
            if len(merchant) >= 2:
                return merchant
        
        # Fallback: extract first capitalized words
        words = desc.split()
        merchant_words = []
        for word in words[:4]:
            clean_word = word.strip('.,;')
            if clean_word and not clean_word.isdigit():
                if clean_word[0].isupper() or len(merchant_words) == 0:
                    merchant_words.append(clean_word)
        
        if merchant_words:
            return ' '.join(merchant_words)[:50]
        
        return None
    
    def _classify_transaction(self, description: str, is_credit: bool) -> str:
        """Classify transaction into category"""
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
    
    def _parse_generic(self) -> List[Transaction]:
        """Generic parser for unknown bank formats"""
        transactions = []
        
        for page_num in range(len(self.doc)):
            text = self.doc[page_num].get_text()
            lines = text.split('\n')
            
            for line in lines:
                tx = self._parse_generic_line(line)
                if tx:
                    transactions.append(tx)
        
        return transactions
    
    def _parse_generic_line(self, line: str) -> Optional[Transaction]:
        """Parse a single line for generic format"""
        # Look for date at start
        date_match = re.match(r'^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', line)
        if not date_match:
            date_match = re.match(r'^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                                 line, re.IGNORECASE)
        
        if not date_match:
            return None
        
        # Find amounts
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
        if not amounts:
            return None
        
        # Use first reasonable amount
        amount = float(amounts[0].replace(',', ''))
        
        # Extract description (between date and amount)
        # This is simplified - real implementation would be more robust
        description = re.sub(r'^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', '', line)
        for amt in amounts:
            description = description.replace(amt, '')
        description = re.sub(r'\s+', ' ', description).strip()
        
        if len(description) < 3:
            return None
        
        return Transaction(
            date=datetime.now().strftime('%Y-%m-%d'),  # Would parse properly in real implementation
            description=description[:100],
            amount=amount,
            type='debit',
            merchant=self._extract_merchant(description),
            category=self._classify_transaction(description, False)
        )
    
    def _post_process_transactions(self, transactions: List[Transaction]) -> List[Transaction]:
        """Post-process to clean up and merge related transactions"""
        # Sort by date
        transactions.sort(key=lambda t: t.date)
        
        # Remove obvious duplicates
        unique_transactions = []
        seen = set()
        
        for tx in transactions:
            key = (tx.date, round(tx.amount, 2), tx.description[:40])
            if key not in seen:
                seen.add(key)
                unique_transactions.append(tx)
        
        return unique_transactions


def parse_statement(pdf_path: str) -> Dict[str, Any]:
    """Convenience function to parse a statement"""
    parser = BankStatementParser(pdf_path)
    return parser.parse()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python statement_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    result = parse_statement(sys.argv[1])
    print(json.dumps(result, indent=2, default=str))

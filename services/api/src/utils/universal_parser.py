#!/usr/bin/env python3
"""
Universal Bank Statement Parser
Auto-detects bank format and extracts transactions from any bank statement PDF

Supported formats:
- HSBC (Australia/UK/HK)
- Chase, BofA, Wells Fargo (US)
- Barclays, NatWest, Lloyds (UK)
- CIBC, RBC, TD (Canada)
- NAB, CommBank, Westpac (Australia)
- And more via auto-detection
"""

import fitz  # PyMuPDF
import json
import re
import sys
from typing import List, Dict, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class BankFormat(Enum):
    """Detected bank formats"""
    HSBC = "hsbc"
    CHASE = "chase"
    BANK_OF_AMERICA = "bofa"
    WELLS_FARGO = "wells_fargo"
    BARCLAYS = "barclays"
    NATWEST = "natwest"
    LLOYDS = "lloyds"
    CIBC = "cibc"
    RBC = "rbc"
    TD = "td"
    NAB = "nab"
    COMMONWEALTH = "commbank"
    WESTPAC = "westpac"
    GENERIC = "generic"


@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    is_expense: bool
    merchant: str = ""
    category: str = ""
    raw_data: str = ""
    confidence: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'date': self.date,
            'description': self.description,
            'amount': self.amount,
            'type': 'debit' if self.is_expense else 'credit',
            'merchant': self.merchant,
            'category': self.category,
            'confidence': self.confidence
        }


@dataclass
class ParseContext:
    """Context maintained during parsing"""
    current_date: Optional[str] = None
    current_year: str = ""
    statement_month: str = ""
    currency: str = "USD"
    page_number: int = 0
    pending_description: List[str] = field(default_factory=list)
    

class UniversalStatementParser:
    """
    Universal parser that auto-detects bank format and extracts transactions
    """
    
    # Bank detection patterns
    BANK_PATTERNS = {
        BankFormat.HSBC: ['hsbc', 'hong kong & shanghai banking', 'hsbc bank'],
        BankFormat.CHASE: ['chase', 'jpmorgan chase'],
        BankFormat.BANK_OF_AMERICA: ['bank of america', 'bofa'],
        BankFormat.WELLS_FARGO: ['wells fargo'],
        BankFormat.BARCLAYS: ['barclays'],
        BankFormat.NATWEST: ['natwest', 'national westminster'],
        BankFormat.LLOYDS: ['lloyds', 'lloyds bank'],
        BankFormat.CIBC: ['cibc', 'canadian imperial bank'],
        BankFormat.RBC: ['rbc', 'royal bank of canada'],
        BankFormat.TD: ['td bank', 'toronto-dominion'],
        BankFormat.NAB: ['nab', 'national australia bank'],
        BankFormat.COMMONWEALTH: ['commbank', 'commonwealth bank'],
        BankFormat.WESTPAC: ['westpac'],
    }
    
    # Date format patterns for different regions
    DATE_PATTERNS = [
        # DD MMM YY/YYYY (19 Jan 26, 19 Jan 2026)
        (r'\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b', 
         lambda m: parse_dmy_date(m.group(1), m.group(2), m.group(3))),
        
        # DDMMMYY with word boundaries (19JAN26) - must be at word boundary
        (r'\b(\d{1,2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d{2,4})\b',
         lambda m: parse_dmy_date(m.group(1), m.group(2), m.group(3))),
        
        # DD/MM/YYYY or DD-MM-YYYY (19/01/2026, 19-01-2026)
        (r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b',
         lambda m: parse_dm_date(m.group(1), m.group(2), m.group(3))),
        
        # MM/DD/YYYY (US format - 01/19/2026)
        (r'\b(0[1-9]|1[0-2])/(\d{1,2})/(\d{4})\b',
         lambda m: parse_md_date(m.group(1), m.group(2), m.group(3))),
        
        # YYYY-MM-DD (ISO format)
        (r'\b(\d{4})-(\d{1,2})-(\d{1,2})\b',
         lambda m: f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"),
    ]
    
    # Amount patterns (various currency formats)
    AMOUNT_PATTERNS = [
        # Standard: 1,234.56 or 54.00 or 0.07
        r'\b([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2})\b',
        # European: 1.234,56
        r'\b([+-]?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})\b',
    ]
    
    # Skip patterns (headers, footers, non-transaction lines)
    SKIP_PATTERNS = [
        r'^\s*page\s+\d+',
        r'^\s*statement\s+(period|date)',
        r'^\s*balance\s+(brought\s+forward|carried\s+forward|forward)',
        r'^\s*opening\s+balance',
        r'^\s*closing\s+balance',
        r'^\s*total\s+(deposits|withdrawals|payments|credits|debits)',
        r'^\s*account\s+(number|summary)',
        r'^\s*transaction\s+(details|history)',
        r'^\s*date\s+description\s+amount',  # Headers
        r'^\s*contact\s+us',
        r'^\s*www\.[a-z]+\.(com|net|org|co\.\w+)',
        r'^\s*\d{3}-\d{3}-\d{4}',  # Phone numbers
        r'^\s*if\s+you\s+have\s+questions',
        r'^\s*important\s+information',
        r'^\s*privacy\s+policy',
        r'^\s*terms\s+and\s+conditions',
        r'^\s*transaction\s+total',  # Summary line
        r'^\s*end\s+of\s+statement',  # End marker
    ]
    
    def __init__(self):
        self.context = ParseContext()
        self.detected_format = BankFormat.GENERIC
        self.statement_start_year = None
        self.statement_end_year = None
        
    def parse(self, pdf_path: str) -> Dict[str, Any]:
        """Main parse method"""
        # Extract all text
        doc = fitz.open(pdf_path)
        all_lines = []
        
        for page_num, page in enumerate(doc):
            text = page.get_text()
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            all_lines.extend(lines)
        
        # Detect bank format
        self.detected_format = self._detect_bank_format(all_lines)
        
        # Detect currency
        self.context.currency = self._detect_currency(all_lines)
        
        # Detect statement period/year
        self.context.current_year = self._detect_year(all_lines)
        
        # Extract transactions based on format
        transactions = self._extract_transactions(all_lines)
        
        # Post-process
        transactions = self._post_process(transactions)
        
        return {
            'bankName': self.detected_format.value.upper(),
            'currency': self.context.currency,
            'transactions': [t.to_dict() for t in transactions],
            'totalTransactions': len(transactions),
            'debits': len([t for t in transactions if t.is_expense]),
            'credits': len([t for t in transactions if not t.is_expense]),
            'extractionMethod': f'universal_parser_{self.detected_format.value}'
        }
    
    def _detect_bank_format(self, lines: List[str]) -> BankFormat:
        """Detect bank format from text patterns"""
        text_lower = ' '.join(lines[:50]).lower()  # Check first 50 lines
        
        for bank_format, patterns in self.BANK_PATTERNS.items():
            if any(pattern in text_lower for pattern in patterns):
                return bank_format
        
        return BankFormat.GENERIC
    
    def _detect_currency(self, lines: List[str]) -> str:
        """Detect currency from text"""
        text = ' '.join(lines[:30]).upper()
        
        currency_patterns = {
            'AUD': ['AUD', 'AUSTRALIAN DOLLAR', 'A$'],
            'USD': ['USD', 'US DOLLAR', '$'],
            'GBP': ['GBP', 'BRITISH POUND', '£'],
            'EUR': ['EUR', 'EURO', '€'],
            'CAD': ['CAD', 'CANADIAN DOLLAR', 'C$'],
            'EGP': ['EGP', 'EGYPTIAN POUND', 'ج.م'],
        }
        
        for currency, patterns in currency_patterns.items():
            if any(p in text for p in patterns):
                return currency
        
        return 'USD'  # Default
    
    def _detect_year(self, lines: List[str]) -> str:
        """Detect statement year from period or dates"""
        # Look for statement period with year range
        for line in lines[:30]:
            # Pattern: "16 Dec 2025 TO 16 Jan 2026" - capture both years
            match = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})\s+\w+\s+(\d{1,2})\s+(\w+)\s+(\d{4})', line, re.I)
            if match:
                self.statement_start_year = match.group(3)
                self.statement_end_year = match.group(6)
                return match.group(6)  # Use end year as default
            
            # Pattern with single year
            match = re.search(r'\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})', line, re.I)
            if match:
                return match.group(2)
            
            # Direct year
            match = re.search(r'\b(20\d{2})\b', line)
            if match:
                return match.group(1)
        
        return str(datetime.now().year)
    
    def _extract_transactions(self, lines: List[str]) -> List[Transaction]:
        """Extract transactions using format-specific logic"""
        transactions = []
        
        # Use format-specific extractor if available
        if self.detected_format == BankFormat.HSBC:
            transactions = self._extract_hsbc(lines)
        else:
            # Generic extractor works for most formats
            transactions = self._extract_generic(lines)
        
        return transactions
    
    def _should_skip_hsbc(self, line: str) -> bool:
        """HSBC-specific skip check - more lenient for amount-only lines"""
        if len(line) < 2:
            return True
        
        # Skip patterns (headers, footers)
        skip_patterns = [
            r'^\s*page\s+\d+',
            r'^\s*statement\s+(period|date)',
            r'^\s*balance\s+(brought\s+forward|carried\s+forward|forward)',
            r'^\s*opening\s+balance',
            r'^\s*closing\s+balance',
            r'^\s*total\s+(deposits|withdrawals|payments|credits|debits)',
            r'^\s*account\s+(number|summary)',
            r'^\s*transaction\s+(details|history)',
            r'^\s*date\s+description\s+amount',
            r'^\s*contact\s+us',
            r'^\s*www\.[a-z]+\.(com|net|org|co\.\w+)',
            r'^\s*\d{3}-\d{3}-\d{4}',
            r'^\s*if\s+you\s+have\s+questions',
            r'^\s*important\s+information',
            r'^\s*privacy\s+policy',
            r'^\s*terms\s+and\s+conditions',
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                return True
        
        return False
    
    def _extract_hsbc(self, lines: List[str]) -> List[Transaction]:
        """HSBC-specific extraction (multi-line transactions)
        
        HSBC format patterns:
        1. Date on line: "19 Jan"
           Description on next line(s): "EFTPOS VISA AUD BIG W..."
           Amount on following line: "54.00"
           
        2. Single line with description and amount:
           "1047673736621 PYPL Payin4 0219160 2.01"
           
        3. Cashback format:
           "18JAN26  739230 13:19:24 COLES 0924 2% Cashback -"
           "Enjoy 739230 ROUSE HI 36 3648"
           "0.07"
        """
        transactions = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            if self._should_skip_hsbc(line):
                i += 1
                continue
            
            # Check for main date: "19 Jan", "30 Jan"
            date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', line, re.I)
            if date_match:
                day = int(date_match.group(1))
                month = date_match.group(2).upper()
                
                # Determine correct year (handle statements spanning across years)
                year = self.context.current_year
                if self.statement_start_year and self.statement_end_year:
                    start_year = int(self.statement_start_year)
                    end_year = int(self.statement_end_year)
                    month_lower = month.lower()
                    
                    # If start and end years are different (e.g., Dec 2025 to Jan 2026)
                    if start_year < end_year:
                        # Jan-Mar should use end year (2026)
                        if month_lower in ['jan', 'feb', 'mar']:
                            year = self.statement_end_year
                        else:
                            year = self.statement_start_year
                    else:
                        year = self.statement_start_year
                elif self.statement_end_year:
                    year = self.statement_end_year
                elif self.statement_start_year:
                    year = self.statement_start_year
                
                self.context.current_date = f'{year}-{month}-{day:02d}'
                i += 1
                continue
            
            # Skip lines that start with cashback date format: "16DEC25"
            # These are reference lines for cashback entries, not transaction dates
            if re.match(r'^\d{1,2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}', line, re.I):
                # Still process this line for amounts (it has description), but don't extract date from it
                pass
            
            # Look for amounts on this line
            amounts = self._extract_amounts(line)
            
            if amounts and self.context.current_date:
                # Try to get description from this line first
                desc = self._clean_description(line, amounts)
                
                # If description is too short, look back for it
                if len(desc) < 10:
                    # Look back up to 3 lines for description
                    desc_lines = []
                    for j in range(i-1, max(-1, i-4), -1):
                        prev = lines[j]
                        # Stop if we hit a date or another amount line
                        if re.match(r'\d{1,2}\s+(Jan|Feb)', prev, re.I):
                            break
                        if self._extract_amounts(prev) and j < i-1:
                            break  # Another amount line
                        if self._should_skip(prev):
                            continue
                        if len(prev) > 3:
                            desc_lines.insert(0, prev)
                    
                    if desc_lines:
                        desc = ' '.join(desc_lines)
                
                if len(desc) >= 3:
                    for amt in amounts:
                        if amt >= 10000:  # Skip running balances
                            continue
                        
                        is_expense = self._classify_as_expense(desc)
                        
                        # Special case: Check if upcoming lines have a new date
                        # If so, this transaction might belong to that date (for deposits like salary)
                        # Only apply to large amounts (>>100) that look like deposits, not cashback
                        tx_date = self.context.current_date
                        if amt > 100 and 'EFTPOS' not in desc.upper() and 'VISA' not in desc.upper() and 'CASHBACK' not in desc.upper():
                            # Look ahead up to 2 lines for a date (for deposits like salary)
                            for k in range(1, 3):
                                if i + k < len(lines):
                                    next_line = lines[i + k]
                                    next_date_match = re.match(r'(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\b', next_line, re.I)
                                    if next_date_match:
                                        day = int(next_date_match.group(1))
                                        month = next_date_match.group(2).upper()
                                        
                                        # Use proper year detection logic instead of blindly using context.current_year
                                        lookahead_year = self.context.current_year
                                        if self.statement_start_year and self.statement_end_year:
                                            start_year = int(self.statement_start_year)
                                            end_year = int(self.statement_end_year)
                                            month_lower = month.lower()
                                            
                                            if start_year < end_year:
                                                if month_lower in ['jan', 'feb', 'mar']:
                                                    lookahead_year = self.statement_end_year
                                                else:
                                                    lookahead_year = self.statement_start_year
                                            else:
                                                lookahead_year = self.statement_start_year
                                        elif self.statement_end_year:
                                            lookahead_year = self.statement_end_year
                                        elif self.statement_start_year:
                                            lookahead_year = self.statement_start_year
                                            
                                        tx_date = f'{lookahead_year}-{month}-{day:02d}'
                                        break
                        
                        tx = Transaction(
                            date=tx_date,
                            description=desc[:100],
                            amount=amt,
                            is_expense=is_expense,
                            merchant=self._extract_merchant(desc),
                            category=self._classify_category(desc, is_expense)
                        )
                        
                        # Only skip if EXACT duplicate (same date, amount, AND full description)
                        is_dup = any(
                            t.date == tx.date and 
                            abs(t.amount - tx.amount) < 0.01 and
                            t.description == tx.description  # Full description match
                            for t in transactions
                        )
                        
                        if not is_dup:
                            transactions.append(tx)
            
            i += 1
        
        return transactions
    
    def _extract_generic(self, lines: List[str]) -> List[Transaction]:
        """Generic extraction for any bank format"""
        transactions = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            if self._should_skip(line):
                i += 1
                continue
            
            # Try to extract date
            date = self._extract_date(line)
            
            # Try to extract amounts
            amounts = self._extract_amounts(line)
            
            if date:
                self.context.current_date = date
            
            if amounts and self.context.current_date:
                # Get description (text between date and amounts)
                desc = self._extract_description(line, date, amounts)
                
                if len(desc) >= 3:
                    for amt in amounts:
                        if amt >= 10000:  # Likely a balance
                            continue
                        
                        is_expense = self._classify_as_expense(desc)
                        
                        tx = Transaction(
                            date=self.context.current_date,
                            description=desc[:100],
                            amount=amt,
                            is_expense=is_expense,
                            merchant=self._extract_merchant(desc),
                            category=self._classify_category(desc, is_expense)
                        )
                        
                        if not self._is_duplicate(transactions, tx):
                            transactions.append(tx)
            
            i += 1
        
        return transactions
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extract date from text using multiple patterns"""
        for pattern, parser in self.DATE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return parser(match)
                except:
                    continue
        return None
    
    def _extract_amounts(self, text: str) -> List[float]:
        """Extract all amounts from text"""
        amounts = []
        for pattern in self.AMOUNT_PATTERNS:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    # Clean and parse
                    clean = match.replace(',', '').replace('+', '')
                    amt = float(clean)
                    if amt > 0:
                        amounts.append(amt)
                except:
                    continue
        return amounts
    
    def _extract_description(self, line: str, date: Optional[str], amounts: List[float]) -> str:
        """Extract description from line"""
        desc = line
        
        # Remove date
        if date:
            for pattern, _ in self.DATE_PATTERNS:
                desc = re.sub(pattern, '', desc, flags=re.I)
        
        # Remove amounts
        for pattern in self.AMOUNT_PATTERNS:
            desc = re.sub(pattern, '', desc)
        
        # Clean up
        desc = re.sub(r'\s+', ' ', desc).strip()
        desc = re.sub(r'^[\-\*\|\s]+', '', desc)  # Leading separators
        
        return desc
    
    def _clean_description(self, line: str, amounts: List[float]) -> str:
        """Clean line to get description"""
        desc = line
        for amt in amounts:
            # Try both formatted versions (with and without comma)
            desc = desc.replace(str(amt), '')
            desc = desc.replace(f"{amt:,.2f}", '')
            # Also try with thousands separator only
            if amt >= 1000:
                desc = desc.replace(f"{amt:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'), '')
        desc = re.sub(r'\s+', ' ', desc).strip()
        return desc
    
    def _should_skip(self, line: str) -> bool:
        """Check if line should be skipped"""
        if len(line) < 2:
            return True
        
        for pattern in self.SKIP_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                return True
        
        # Skip lines that are just amounts
        if re.match(r'^[\d\s,\.\-]+$', line):
            return True
        
        return False
    
    def _classify_as_expense(self, desc: str) -> bool:
        """Determine if transaction is an expense"""
        desc_upper = desc.upper()
        
        # These are typically expenses
        if any(kw in desc_upper for kw in ['EFTPOS', 'VISA', 'MASTERCARD', 'DEBIT', 'PURCHASE']):
            return True
        
        # These are typically income
        if any(kw in desc_upper for kw in ['SALARY', 'DEPOSIT', 'CREDIT', 'REFUND', 'CASHBACK', 'TRANSFER FROM', 'HINDMARSH']):
            return False
        
        # Check for negative sign or DR/CR indicators
        if ' CR' in desc_upper or ' CREDIT' in desc_upper:
            return False
        if ' DR' in desc_upper or ' DEBIT' in desc_upper:
            return True
        
        # Default to expense for unknown
        return True
    
    def _extract_merchant(self, desc: str) -> str:
        """Extract merchant name"""
        patterns = [
            r'(?:EFTPOS|VISA|MASTERCARD)\s+(?:AUD|USD|GBP|EUR|CAD)?\s*([A-Z][A-Z\s\u0026\*\.]+?)(?:\s+\d|\s*$)',
            r'(?:PURCHASE|POS)\s+([A-Z][A-Z\s\u0026\*\.]+?)(?:\s+\d|\s*$)',
            r'(HINDMARSH)',
            r'([A-Z][A-Z\s\u0026\*\.]+(?:PTY|LTD|LLC|INC|PLC|LIMITED|CORP|BANK))',
            r'([A-Z][A-Z\s]+(?:RESTAURANT|CAFE|STORE|SHOP|MARKET|MART))',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, desc, re.I)
            if match:
                return match.group(1).strip()
        
        # Return first meaningful word
        words = [w for w in desc.split() if len(w) > 2 and not w.isdigit()]
        return words[0] if words else 'Unknown'
    
    def _classify_category(self, desc: str, is_expense: bool) -> str:
        """Classify transaction category"""
        if not is_expense:
            if 'CASHBACK' in desc.upper():
                return 'Cashback'
            return 'Income'
        
        categories = {
            'Food': ['WOOLWORTHS', 'COLES', 'ALDI', 'SAFEWAY', 'KROGER', 'TESCO', 'SAINSBURY', 'ASDA', 'FOOD', 'GROCERY', 'SUPERMARKET'],
            'Dining': ['RESTAURANT', 'CAFE', 'PIZZA', 'GRILL', 'SHAWARMA', 'MCDONALD', 'STARBUCKS', 'UBER EATS', 'DOORDASH'],
            'Transport': ['UBER', 'LYFT', 'TAXI', 'PETROL', 'GAS', 'FUEL', 'SHELL', 'BP', 'EXXON', 'TRANSPORT'],
            'Shopping': ['AMAZON', 'EBAY', 'WALMART', 'TARGET', 'BEST BUY', 'COSTCO', 'BIG W', 'KMART', 'SHOPPING'],
            'Utilities': ['ELECTRIC', 'GAS', 'WATER', 'ENERGY', 'ORIGIN', 'AGL', 'TELECOM', 'PHONE', 'INTERNET'],
            'Health': ['CHEMIST', 'PHARMACY', 'DOCTOR', 'HOSPITAL', 'MEDICAL', 'HEALTH', 'PHARMACY'],
            'Entertainment': ['NETFLIX', 'SPOTIFY', 'CINEMA', 'MOVIE', 'GAME', 'ENTERTAINMENT'],
            'Transfer': ['PAYPAL', 'PYPL', 'TRANSFER', 'RTP', 'WIRE', 'ZELLE', 'VENMO'],
        }
        
        desc_upper = desc.upper()
        for category, keywords in categories.items():
            if any(kw in desc_upper for kw in keywords):
                return category
        
        return 'Other'
    
    def _is_duplicate(self, transactions: List[Transaction], new_tx: Transaction) -> bool:
        """Check if transaction is a duplicate"""
        for tx in transactions[-5:]:  # Check last 5 only
            if (tx.date == new_tx.date and 
                abs(tx.amount - new_tx.amount) < 0.01 and
                tx.description[:30] == new_tx.description[:30]):
                return True
        return False
    
    def _post_process(self, transactions: List[Transaction]) -> List[Transaction]:
        """Post-process transactions"""
        # Sort by date
        transactions.sort(key=lambda x: (x.date, x.amount), reverse=True)
        
        # Remove obvious errors (zero amounts, huge amounts)
        transactions = [t for t in transactions if 0.01 <= t.amount <= 1000000]
        
        return transactions


# Helper functions for date parsing
def parse_dmy_date(day: str, month_str: str, year: str) -> str:
    """Parse DD MMM YYYY format"""
    months = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    month = months.get(month_str.lower()[:3], 1)
    
    # Handle 2-digit year
    if len(year) == 2:
        year_int = int(year)
        if year_int >= 50:
            year = '19' + year
        else:
            year = '20' + year
    
    return f"{year}-{month:02d}-{int(day):02d}"


def parse_dm_date(day: str, month: str, year: str) -> str:
    """Parse DD/MM/YYYY format"""
    if len(year) == 2:
        year_int = int(year)
        year = '19' + year if year_int >= 50 else '20' + year
    return f"{year}-{int(month):02d}-{int(day):02d}"


def parse_md_date(month: str, day: str, year: str) -> str:
    """Parse MM/DD/YYYY format (US)"""
    if len(year) == 2:
        year_int = int(year)
        year = '19' + year if year_int >= 50 else '20' + year
    return f"{year}-{int(month):02d}-{int(day):02d}"


def main():
    if len(sys.argv) < 2:
        print("Usage: python universal_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    parser = UniversalStatementParser()
    result = parser.parse(sys.argv[1])
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

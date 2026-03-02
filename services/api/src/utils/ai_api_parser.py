#!/usr/bin/env python3
"""
AI-Powered Bank Statement Parser (API-based)
Uses OpenAI/Claude/Gemini API for intelligent transaction extraction

Advantages:
- No local model installation needed
- Better accuracy with GPT-4/Claude vision models
- Can handle any bank format without custom rules
- Understands context (deposits vs withdrawals, dates, etc.)

Usage:
  export OPENAI_API_KEY=your_key
  python ai_api_parser.py statement.pdf
"""

import fitz
import json
import sys
import os
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Try Z.ai API (GLM)
try:
    import requests
    ZAI_AVAILABLE = True
except ImportError:
    ZAI_AVAILABLE = False


@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    type: str
    confidence: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'date': self.date,
            'description': self.description,
            'amount': self.amount,
            'type': self.type,
            'confidence': self.confidence
        }


class AIAPIParser:
    """
    AI-powered parser using API-based models
    """
    
    def __init__(self, provider: str = "openai"):
        self.provider = provider
        self.client = None
        
        if provider == "openai" and OPENAI_AVAILABLE:
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.client = OpenAI(api_key=api_key)
        elif provider == "zai":
            api_key = os.getenv('ZAI_API_KEY')
            if api_key and ZAI_AVAILABLE:
                self.client = True  # Use requests for Z.ai
            else:
                print(f"Z.ai not available: api_key={bool(api_key)}, requests={ZAI_AVAILABLE}", file=sys.stderr)
        
        self.system_prompt = """You are a financial document parser. Your task is to extract transactions from bank statements.

For each transaction, extract:
1. Date (YYYY-MM-DD format)
2. Description (merchant/transaction details)
3. Amount (numeric value)
4. Type (debit for expenses/withdrawals, credit for deposits/income)

Rules:
- Look for date patterns like "19 Jan", "18JAN26", "19/01/2026"
- Amounts with "EFTPOS", "VISA", "DEBIT" are typically debits (expenses)
- Amounts with "DEPOSIT", "CREDIT", "TRANSFER FROM" are typically credits (income)
- "Cashback" entries are credits (income)
- "Balance" lines are NOT transactions - skip them
- "Transaction Total" is NOT a transaction - skip it
- Lines with only amounts (like "9,615.68") are running balances - skip them
- For dates like "18JAN26", convert to 2026-01-18

Return ONLY a JSON array of transactions. Example:
[
  {"date": "2026-01-19", "description": "EFTPOS VISA AUD BIG W", "amount": 54.00, "type": "debit"},
  {"date": "2026-01-20", "description": "Salary Deposit HINDMARSH", "amount": 6820.76, "type": "credit"}
]"""
    
    def parse(self, pdf_path: str) -> Dict[str, Any]:
        """Parse PDF using AI API"""
        # Extract text from PDF
        text = self._extract_text(pdf_path)
        
        # If no API available, use local fallback
        if not self.client:
            print("No AI API available, using regex fallback...", file=sys.stderr)
            from universal_parser import UniversalStatementParser
            parser = UniversalStatementParser()
            return parser.parse(pdf_path)
        
        # Use AI to extract transactions
        transactions = self._extract_with_ai(text)
        
        return {
            'bankName': self._detect_bank(text),
            'currency': self._detect_currency(text),
            'transactions': [t.to_dict() for t in transactions],
            'totalTransactions': len(transactions),
            'extractionMethod': f'ai_api_{self.provider}'
        }
    
    def _extract_text(self, pdf_path: str) -> str:
        """Extract text from PDF"""
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n---PAGE BREAK---\n"
        return text
    
    def _extract_with_ai(self, text: str) -> List[Transaction]:
        """Use AI API to extract transactions"""
        # Truncate text if too long
        max_chars = 8000
        if len(text) > max_chars:
            text = text[:max_chars] + "\n...[truncated]"
        
        user_prompt = f"""Extract all transactions from this bank statement:

{text}

Return ONLY a JSON array of transactions with fields: date, description, amount, type."""
        
        try:
            if self.provider == "openai":
                return self._call_openai(user_prompt)
            elif self.provider == "zai":
                return self._call_zai(user_prompt)
            else:
                return []
        except Exception as e:
            print(f"AI API call failed: {e}", file=sys.stderr)
            return []
    
    def _call_openai(self, prompt: str) -> List[Transaction]:
        """Call OpenAI API"""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",  # or gpt-4o for better accuracy
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistent output
            max_tokens=4000
        )
        
        content = response.choices[0].message.content
        return self._parse_response(content)
    
    def _call_zai(self, prompt: str) -> List[Transaction]:
        """Call Z.ai GLM API"""
        api_key = os.getenv('ZAI_API_KEY')
        if not api_key:
            return []
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "glm-4-flash",
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1
        }
        
        response = requests.post(
            "https://api.z.ai/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        return self._parse_response(content)
    
    def _parse_response(self, content: str) -> List[Transaction]:
        """Parse AI response into transactions"""
        transactions = []
        
        # Try to find JSON in the response
        # Look for array pattern [...]
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                for item in data:
                    if isinstance(item, dict):
                        tx = Transaction(
                            date=item.get('date', ''),
                            description=item.get('description', ''),
                            amount=float(item.get('amount', 0)),
                            type=item.get('type', 'debit'),
                            confidence=0.9
                        )
                        transactions.append(tx)
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}", file=sys.stderr)
                print(f"Content: {content[:500]}", file=sys.stderr)
        
        return transactions
    
    def _detect_bank(self, text: str) -> str:
        """Detect bank from text"""
        text_lower = text.lower()
        banks = {
            'HSBC': ['hsbc'],
            'Chase': ['chase'],
            'Bank of America': ['bank of america'],
            'Wells Fargo': ['wells fargo'],
        }
        for bank, keywords in banks.items():
            if any(kw in text_lower for kw in keywords):
                return bank
        return "Unknown Bank"
    
    def _detect_currency(self, text: str) -> str:
        """Detect currency"""
        text_upper = text.upper()
        if 'AUD' in text_upper:
            return 'AUD'
        elif 'USD' in text_upper:
            return 'USD'
        elif 'GBP' in text_upper:
            return 'GBP'
        return 'USD'


def main():
    if len(sys.argv) < 2:
        print("Usage: python ai_api_parser.py <pdf_path> [--provider openai|zai]", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    provider = "openai"
    
    if '--provider' in sys.argv:
        idx = sys.argv.index('--provider')
        if idx + 1 < len(sys.argv):
            provider = sys.argv[idx + 1]
    
    parser = AIAPIParser(provider=provider)
    result = parser.parse(pdf_path)
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

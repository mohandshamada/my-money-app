#!/usr/bin/env python3
"""
AI-Powered Bank Statement Parser using Anthropic Claude
"""

import fitz
import json
import sys
import os
import re
from typing import List, Dict, Any
from dataclasses import dataclass

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


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


class ClaudeParser:
    def __init__(self):
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        self.api_url = "https://api.anthropic.com/v1/messages"
        
    def parse(self, pdf_path: str) -> Dict[str, Any]:
        # Extract text
        text = self._extract_text(pdf_path)
        
        if not self.api_key or not REQUESTS_AVAILABLE:
            print("Claude API not available, using fallback...", file=sys.stderr)
            from universal_parser import UniversalStatementParser
            return UniversalStatementParser().parse(pdf_path)
        
        # Use Claude to extract
        transactions = self._extract_with_claude(text)
        
        return {
            'bankName': 'HSBC',
            'currency': 'AUD',
            'transactions': [t.to_dict() for t in transactions],
            'totalTransactions': len(transactions),
            'extractionMethod': 'claude_ai'
        }
    
    def _extract_text(self, pdf_path: str) -> str:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        return text[:10000]  # Limit to 10k chars
    
    def _extract_with_claude(self, text: str) -> List[Transaction]:
        system_prompt = """You are a bank statement parser. Extract ALL transactions from the provided text.

For each transaction, return:
- date: YYYY-MM-DD format
- description: The merchant/transaction description
- amount: numeric value (just the number)
- type: "debit" for expenses/withdrawals or "credit" for deposits/income

IMPORTANT RULES:
1. Skip lines that are just running balances (like "9,615.68" alone)
2. Skip "Transaction Total" lines
3. Skip "Opening Balance" and "Closing Balance"
4. EFTPOS/VISA transactions are debits (expenses)
5. Cashback entries are credits (income)
6. Salary/deposit entries are credits
7. For dates like "18JAN26", convert to 2026-01-18
8. For "30 Dec" in a statement ending Jan 2026, use 2025-12-30

Return ONLY a JSON array. Example:
[
  {"date": "2025-12-30", "description": "HINDMARSH CONSTR Salary", "amount": 9575.76, "type": "credit"},
  {"date": "2026-01-16", "description": "EFTPOS VISA BIG W", "amount": 54.00, "type": "debit"}
]"""

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        data = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": 4000,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": f"Extract transactions from this bank statement:\n\n{text}"}
            ]
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            result = response.json()
            
            if 'content' in result and len(result['content']) > 0:
                content = result['content'][0]['text']
                return self._parse_response(content)
            else:
                print(f"API error: {result}", file=sys.stderr)
                return []
        except Exception as e:
            print(f"Claude API error: {e}", file=sys.stderr)
            return []
    
    def _parse_response(self, content: str) -> List[Transaction]:
        transactions = []
        
        # Find JSON array
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                for item in data:
                    if isinstance(item, dict):
                        transactions.append(Transaction(
                            date=item.get('date', ''),
                            description=item.get('description', ''),
                            amount=float(item.get('amount', 0)),
                            type=item.get('type', 'debit'),
                            confidence=0.95
                        ))
            except Exception as e:
                print(f"Parse error: {e}", file=sys.stderr)
        
        return transactions


def main():
    if len(sys.argv) < 2:
        print("Usage: python claude_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    parser = ClaudeParser()
    result = parser.parse(sys.argv[1])
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

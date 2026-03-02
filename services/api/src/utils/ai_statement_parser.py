#!/usr/bin/env python3
"""
AI-Based Bank Statement Parser
Uses LLM (Gemini/Claude/GPT-4) to extract ALL transactions from PDFs

Features:
- Converts PDF to images for visual understanding
- Uses Vision LLM to parse transaction tables
- Handles complex layouts, multi-page statements
- Captures ALL transactions including credits/debits/cashback
"""

import os
import json
import sys
import base64
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import tempfile

# Try to import pdf2image for converting PDF to images
try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

# Try to import PIL
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    type: str  # 'debit' or 'credit'
    merchant: Optional[str] = None
    category: Optional[str] = None
    raw_text: Optional[str] = None


class AIStatementParser:
    """Parse bank statements using AI vision models"""
    
    def __init__(self, pdf_path: str, api_key: Optional[str] = None):
        self.pdf_path = pdf_path
        self.api_key = api_key or os.getenv('GEMINI_API_KEY') or os.getenv('OPENAI_API_KEY')
        
    def parse(self) -> Dict[str, Any]:
        """Main parsing method using AI"""
        if not PDF2IMAGE_AVAILABLE:
            return self._fallback_parse()
        
        # Convert PDF to images
        images = self._pdf_to_images()
        
        if not images:
            return self._fallback_parse()
        
        # Parse with AI
        all_transactions = []
        
        for i, image_path in enumerate(images):
            print(f"Processing page {i+1}/{len(images)}...", file=sys.stderr)
            transactions = self._parse_page_with_ai(image_path, i+1)
            all_transactions.extend(transactions)
        
        # Clean up temp images
        for img_path in images:
            try:
                os.unlink(img_path)
            except:
                pass
        
        # Post-process
        all_transactions = self._post_process(all_transactions)
        
        return {
            'bankName': 'HSBC',
            'currency': 'AUD',
            'transactions': [asdict(t) for t in all_transactions],
            'totalTransactions': len(all_transactions),
            'extractionMethod': 'ai_vision_parser'
        }
    
    def _pdf_to_images(self) -> List[str]:
        """Convert PDF pages to images"""
        try:
            images = convert_from_path(
                self.pdf_path,
                dpi=200,  # Good balance of quality vs speed
                fmt='png'
            )
            
            temp_paths = []
            for i, image in enumerate(images):
                temp_path = tempfile.mktemp(suffix=f'_page_{i+1}.png')
                image.save(temp_path, 'PNG')
                temp_paths.append(temp_path)
            
            return temp_paths
        except Exception as e:
            print(f"Error converting PDF to images: {e}", file=sys.stderr)
            return []
    
    def _parse_page_with_ai(self, image_path: str, page_num: int) -> List[Transaction]:
        """Parse a single page using AI vision model"""
        
        # Try Gemini first (free tier available)
        transactions = self._parse_with_gemini(image_path, page_num)
        if transactions:
            return transactions
        
        # Fallback to OpenAI if Gemini fails
        transactions = self._parse_with_openai(image_path, page_num)
        if transactions:
            return transactions
        
        return []
    
    def _parse_with_gemini(self, image_path: str, page_num: int) -> List[Transaction]:
        """Parse using Google's Gemini Vision API"""
        try:
            import google.generativeai as genai
            
            if not self.api_key:
                return []
            
            genai.configure(api_key=self.api_key)
            
            # Load image
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            prompt = """You are a bank statement parser. Extract ALL transactions from this bank statement page.

Return ONLY a JSON array in this exact format:
[
  {
    "date": "YYYY-MM-DD",
    "description": "transaction description",
    "amount": 123.45,
    "type": "debit" or "credit"
  }
]

Rules:
1. Extract EVERY transaction visible on the page
2. Include cashback entries (small credit amounts like $0.40, $0.83)
3. Date format: YYYY-MM-DD
4. Amount as number (no $ sign)
5. Type: "debit" for money out, "credit" for money in (cashback, deposits)
6. Look for transaction tables with Date, Description, Debits/Withdrawals, Credits/Deposits columns
7. HSBC statements have dates like "17 Dec" and cashback dates like "16DEC25"
8. Do NOT include balance entries (large amounts like $18,556.02)
9. Do NOT include summary totals

Return valid JSON only, no markdown."""

            response = model.generate_content([
                prompt,
                {'mime_type': 'image/png', 'data': image_data}
            ])
            
            # Extract JSON from response
            text = response.text
            return self._extract_transactions_from_text(text)
            
        except Exception as e:
            print(f"Gemini parsing error: {e}", file=sys.stderr)
            return []
    
    def _parse_with_openai(self, image_path: str, page_num: int) -> List[Transaction]:
        """Parse using OpenAI GPT-4 Vision API"""
        try:
            import openai
            
            if not self.api_key:
                return []
            
            client = openai.OpenAI(api_key=self.api_key)
            
            # Encode image
            with open(image_path, 'rb') as f:
                base64_image = base64.b64encode(f.read()).decode('utf-8')
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a bank statement parser. Extract ALL transactions and return as JSON."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Extract ALL transactions from this bank statement page.

Return ONLY a JSON array:
[
  {"date": "YYYY-MM-DD", "description": "...", "amount": 123.45, "type": "debit|credit"}
]

Include ALL transactions, especially cashback entries (small credits like $0.40).
Date format: YYYY-MM-DD. Amount as number. Type: debit=money out, credit=money in.
HSBC format: dates like "17 Dec" or "16DEC25" for cashback."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4000
            )
            
            text = response.choices[0].message.content
            return self._extract_transactions_from_text(text)
            
        except Exception as e:
            print(f"OpenAI parsing error: {e}", file=sys.stderr)
            return []
    
    def _extract_transactions_from_text(self, text: str) -> List[Transaction]:
        """Extract transactions from AI response text"""
        transactions = []
        
        # Find JSON in text
        import re
        
        # Try to find JSON array
        json_match = re.search(r'\[[\s\S]*\]', text)
        if not json_match:
            return transactions
        
        try:
            data = json.loads(json_match.group(0))
            
            for item in data:
                if not isinstance(item, dict):
                    continue
                
                tx = Transaction(
                    date=item.get('date', ''),
                    description=item.get('description', ''),
                    amount=float(item.get('amount', 0)),
                    type=item.get('type', 'debit'),
                    merchant=self._extract_merchant(item.get('description', '')),
                    category=self._classify(item.get('description', ''), item.get('type', 'debit') == 'credit')
                )
                transactions.append(tx)
                
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}", file=sys.stderr)
        
        return transactions
    
    def _extract_merchant(self, description: str) -> Optional[str]:
        """Extract merchant from description"""
        if not description:
            return None
            
        desc_upper = description.upper()
        
        # Known merchants
        merchants = [
            ('MYER', 'Myer'), ('H&M', 'H&M'), ('KMART', 'Kmart'),
            ('BUNNINGS', 'Bunnings'), ('ALDI', 'ALDI'), ('COLES', 'Coles'),
            ('WOOLWORTHS', 'Woolworths'), ('7-ELEVEN', '7-Eleven'),
            ('HARVEY NORMAN', 'Harvey Norman'), ('PAYPAL', 'PayPal'),
            ('UBER', 'Uber'), ('NETFLIX', 'Netflix'), ('SPOTIFY', 'Spotify'),
        ]
        
        for pattern, name in merchants:
            if pattern in desc_upper:
                return name
        
        return description.split()[0] if description else None
    
    def _classify(self, description: str, is_credit: bool) -> str:
        """Classify transaction"""
        if is_credit:
            return 'Cashback' if 'cashback' in description.lower() else 'Income'
        
        desc_upper = description.upper()
        
        if any(x in desc_upper for x in ['WOOLWORTHS', 'COLES', 'ALDI', 'FOOD']):
            return 'Food'
        if any(x in desc_upper for x in ['BUNNINGS', 'HARVEY NORMAN']):
            return 'Home Improvement'
        if any(x in desc_upper for x in ['PAYPAL', 'TRANSFER']):
            return 'Transfer'
        
        return 'Other'
    
    def _post_process(self, transactions: List[Transaction]) -> List[Transaction]:
        """Remove duplicates and sort"""
        seen = set()
        unique = []
        
        for tx in transactions:
            key = (tx.date, round(tx.amount, 2), tx.description[:30])
            if key not in seen:
                seen.add(key)
                unique.append(tx)
        
        return sorted(unique, key=lambda t: t.date)
    
    def _fallback_parse(self) -> Dict[str, Any]:
        """Fallback to text-based parser"""
        from statement_parser_v3 import parse_statement
        return parse_statement(self.pdf_path)


def parse_statement_with_ai(pdf_path: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """Parse statement using AI vision"""
    parser = AIStatementParser(pdf_path, api_key)
    return parser.parse()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python ai_statement_parser.py <pdf_path> [api_key]", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    api_key = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = parse_statement_with_ai(pdf_path, api_key)
    print(json.dumps(result, indent=2, default=str))

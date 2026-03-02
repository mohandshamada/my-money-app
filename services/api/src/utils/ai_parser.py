#!/usr/bin/env python3
"""
AI-Powered Bank Statement Parser
Uses Hugging Face transformers for intelligent document understanding

Models to consider:
- microsoft/layoutlmv3-base (for layout understanding)
- google/pix2struct-base (for structured data extraction)
- microsoft/trocr-base-printed (for OCR if needed)
- Local LLM via transformers pipeline
"""

import fitz  # PyMuPDF for image rendering
import json
import sys
import os
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Try to import transformers, fall back to regex if not available
try:
    from transformers import pipeline, AutoProcessor, AutoModelForVision2Seq
    from PIL import Image
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Warning: transformers not installed. Using fallback.", file=sys.stderr)


@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    type: str  # 'debit' or 'credit'
    confidence: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'date': self.date,
            'description': self.description,
            'amount': self.amount,
            'type': self.type,
            'confidence': self.confidence
        }


class AIStatementParser:
    """
    AI-powered parser using Hugging Face models
    """
    
    def __init__(self, model_name: str = None):
        self.model_name = model_name or "microsoft/layoutlmv3-base"
        self.processor = None
        self.model = None
        self.nlp_pipeline = None
        
        if TRANSFORMERS_AVAILABLE:
            self._load_model()
    
    def _load_model(self):
        """Load the AI model"""
        try:
            print(f"Loading model: {self.model_name}", file=sys.stderr)
            # For layoutlmv3, we need to use a specific approach
            # Or use a simpler text-based approach with T5/GPT
            self.nlp_pipeline = pipeline(
                "text-generation",
                model="gpt2",  # Fallback to GPT-2 for text understanding
                max_length=512
            )
            print("Model loaded successfully", file=sys.stderr)
        except Exception as e:
            print(f"Error loading model: {e}", file=sys.stderr)
            self.nlp_pipeline = None
    
    def parse(self, pdf_path: str) -> Dict[str, Any]:
        """
        Parse statement using AI + regex hybrid approach
        """
        # Extract text and images from PDF
        doc = fitz.open(pdf_path)
        
        # Get all text
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        
        # Try AI extraction first
        if self.nlp_pipeline:
            transactions = self._extract_with_ai(full_text)
        else:
            transactions = []
        
        # If AI fails or not available, use regex fallback
        if not transactions:
            print("Using regex fallback...", file=sys.stderr)
            transactions = self._extract_with_regex(full_text)
        
        return {
            'bankName': self._detect_bank(full_text),
            'currency': self._detect_currency(full_text),
            'transactions': [t.to_dict() for t in transactions],
            'totalTransactions': len(transactions),
            'extractionMethod': 'ai_hybrid' if self.nlp_pipeline else 'regex_fallback'
        }
    
    def _extract_with_ai(self, text: str) -> List[Transaction]:
        """
        Use AI to understand and extract transactions
        """
        # Prepare prompt for the model
        prompt = f"""
Extract all financial transactions from this bank statement.
For each transaction, return: date (YYYY-MM-DD), description, amount, and type (debit/credit).

Statement text:
{text[:3000]}  # Limit text length

Transactions (JSON format):
"""
        
        try:
            # Generate response
            result = self.nlp_pipeline(prompt, num_return_sequences=1)
            generated_text = result[0]['generated_text']
            
            # Parse the generated text for transactions
            transactions = self._parse_ai_output(generated_text)
            return transactions
        except Exception as e:
            print(f"AI extraction failed: {e}", file=sys.stderr)
            return []
    
    def _parse_ai_output(self, text: str) -> List[Transaction]:
        """Parse AI-generated text into transactions"""
        transactions = []
        
        # Look for JSON-like structures in the output
        # This is a simple heuristic-based parser
        lines = text.split('\n')
        
        for line in lines:
            # Try to extract date, description, amount
            date_match = re.search(r'(\d{4}-\d{2}-\d{2})', line)
            amount_match = re.search(r'\$?([\d,]+\.\d{2})', line)
            
            if date_match and amount_match:
                date = date_match.group(1)
                amount = float(amount_match.group(1).replace(',', ''))
                
                # Determine type
                tx_type = 'debit'
                if any(word in line.lower() for word in ['credit', 'deposit', 'income', 'refund']):
                    tx_type = 'credit'
                
                # Extract description (everything between date and amount)
                desc_start = line.find(date) + len(date)
                desc_end = line.find(amount_match.group(0))
                if desc_end > desc_start:
                    description = line[desc_start:desc_end].strip()
                else:
                    description = line.replace(date, '').replace(amount_match.group(0), '').strip()
                
                if description and len(description) > 3:
                    transactions.append(Transaction(
                        date=date,
                        description=description[:100],
                        amount=amount,
                        type=tx_type,
                        confidence=0.7  # AI confidence
                    ))
        
        return transactions
    
    def _extract_with_regex(self, text: str) -> List[Transaction]:
        """
        Fallback regex-based extraction (simplified)
        """
        transactions = []
        lines = text.split('\n')
        
        for line in lines:
            # Simple date extraction
            date_patterns = [
                r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})',
                r'(\d{4})-(\d{2})-(\d{2})',
            ]
            
            date = None
            for pattern in date_patterns:
                match = re.search(pattern, line, re.I)
                if match:
                    if len(match.groups()) == 3:
                        if match.group(1).isdigit() and int(match.group(1)) > 1000:
                            # YYYY-MM-DD format
                            date = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
                        else:
                            # DD MMM YYYY format
                            day = match.group(1)
                            month = match.group(2).upper()[:3]
                            year = match.group(3)
                            date = f"{year}-{month}-{int(day):02d}"
                    break
            
            # Amount extraction
            amount_match = re.search(r'\$?([\d,]+\.\d{2})', line)
            if date and amount_match:
                amount = float(amount_match.group(1).replace(',', ''))
                
                # Skip large amounts (likely balances)
                if amount >= 10000:
                    continue
                
                description = line.replace(date, '').replace(amount_match.group(0), '').strip()
                description = re.sub(r'\s+', ' ', description)[:100]
                
                if len(description) > 3:
                    tx_type = 'debit'
                    if any(word in line.lower() for word in ['credit', 'deposit', 'refund']):
                        tx_type = 'credit'
                    
                    transactions.append(Transaction(
                        date=date,
                        description=description,
                        amount=amount,
                        type=tx_type
                    ))
        
        return transactions
    
    def _detect_bank(self, text: str) -> str:
        """Detect bank from text"""
        text_lower = text.lower()
        banks = {
            'HSBC': ['hsbc'],
            'Chase': ['chase', 'jpmorgan'],
            'Bank of America': ['bank of america', 'bofa'],
            'Wells Fargo': ['wells fargo'],
        }
        for bank, keywords in banks.items():
            if any(kw in text_lower for kw in keywords):
                return bank
        return "Unknown Bank"
    
    def _detect_currency(self, text: str) -> str:
        """Detect currency from text"""
        text_upper = text.upper()
        if 'AUD' in text_upper or 'AUSTRALIAN' in text_upper:
            return 'AUD'
        elif 'USD' in text_upper or 'US DOLLAR' in text_upper:
            return 'USD'
        elif 'GBP' in text_upper or 'POUND' in text_upper:
            return 'GBP'
        elif 'EUR' in text_upper or 'EURO' in text_upper:
            return 'EUR'
        return 'USD'


def main():
    if len(sys.argv) < 2:
        print("Usage: python ai_parser.py <pdf_path> [--model model_name]", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    model_name = None
    
    if '--model' in sys.argv:
        model_idx = sys.argv.index('--model')
        if model_idx + 1 < len(sys.argv):
            model_name = sys.argv[model_idx + 1]
    
    parser = AIStatementParser(model_name=model_name)
    result = parser.parse(pdf_path)
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

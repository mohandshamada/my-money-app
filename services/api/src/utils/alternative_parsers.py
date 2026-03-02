#!/usr/bin/env python3
"""
Alternative PDF Parsing Implementations
Demonstrates different tools for bank statement parsing

Tools demonstrated:
1. pdfminer.six - Low-level parsing with layout preservation
2. pypdfium2 - Fast extraction using PDFium
3. pymupdf4llm - LLM-optimized markdown extraction (optional)
"""

import json
import re
import sys
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ParseResult:
    """Standard parse result structure"""
    bank_name: str
    currency: str
    transactions: List[Dict[str, Any]]
    method: str
    success: bool
    error: Optional[str] = None


class PDFMinerParser:
    """
    Parser using pdfminer.six
    Best for: Layout-aware text extraction
    Pros: Precise positioning, good for complex layouts
    Cons: Slower than PyMuPDF
    """
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        
    def parse(self) -> ParseResult:
        try:
            from pdfminer.high_level import extract_text
            from pdfminer.layout import LAParams
            
            # Extract with layout analysis
            text = extract_text(
                self.pdf_path,
                laparams=LAParams(
                    line_margin=0.5,
                    char_margin=2.0,
                    word_margin=0.1
                )
            )
            
            # Parse extracted text
            transactions = self._parse_text(text)
            
            return ParseResult(
                bank_name=self._detect_bank(text),
                currency='AUD',
                transactions=transactions,
                method='pdfminer.six',
                success=len(transactions) > 0
            )
            
        except Exception as e:
            return ParseResult(
                bank_name='Unknown',
                currency='USD',
                transactions=[],
                method='pdfminer.six',
                success=False,
                error=str(e)
            )
    
    def _parse_text(self, text: str) -> List[Dict[str, Any]]:
        """Parse transactions from extracted text"""
        transactions = []
        lines = text.split('\n')
        
        for line in lines:
            # Look for date patterns
            date_match = re.search(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                                  line, re.IGNORECASE)
            if date_match:
                # Found a date - look for amounts
                amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
                if amounts:
                    amount = float(amounts[0].replace(',', ''))
                    transactions.append({
                        'date': f"2025-{self._month_to_num(date_match.group(2))}-{date_match.group(1).zfill(2)}",
                        'description': line.strip()[:100],
                        'amount': amount,
                        'type': 'debit'
                    })
        
        return transactions
    
    def _month_to_num(self, month: str) -> str:
        months = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        return months.get(month.lower()[:3], '01')
    
    def _detect_bank(self, text: str) -> str:
        text_upper = text.upper()
        if 'HSBC' in text_upper:
            return 'HSBC'
        if 'CHASE' in text_upper:
            return 'Chase'
        return 'Unknown'


class PyPdfiumParser:
    """
    Parser using pypdfium2
    Best for: Speed
    Pros: Very fast, uses Google's PDFium engine
    Cons: Less layout information
    """
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        
    def parse(self) -> ParseResult:
        try:
            import pypdfium2 as pdfium
            
            pdf = pdfium.PdfDocument(self.pdf_path)
            all_text = ""
            
            for page in pdf:
                text_page = page.get_textpage()
                all_text += text_page.get_text_bounded() + "\n"
                text_page.close()
                page.close()
            
            pdf.close()
            
            # Parse extracted text
            transactions = self._parse_text(all_text)
            
            return ParseResult(
                bank_name=self._detect_bank(all_text),
                currency='AUD',
                transactions=transactions,
                method='pypdfium2',
                success=len(transactions) > 0
            )
            
        except Exception as e:
            return ParseResult(
                bank_name='Unknown',
                currency='USD',
                transactions=[],
                method='pypdfium2',
                success=False,
                error=str(e)
            )
    
    def _parse_text(self, text: str) -> List[Dict[str, Any]]:
        """Parse transactions from text"""
        # Similar implementation to PDFMinerParser
        transactions = []
        lines = text.split('\n')
        
        for line in lines:
            date_match = re.search(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                                  line, re.IGNORECASE)
            if date_match:
                amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
                if amounts:
                    amount = float(amounts[0].replace(',', ''))
                    transactions.append({
                        'date': f"2025-{self._month_to_num(date_match.group(2))}-{date_match.group(1).zfill(2)}",
                        'description': line.strip()[:100],
                        'amount': amount,
                        'type': 'debit'
                    })
        
        return transactions
    
    def _month_to_num(self, month: str) -> str:
        months = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        return months.get(month.lower()[:3], '01')
    
    def _detect_bank(self, text: str) -> str:
        text_upper = text.upper()
        if 'HSBC' in text_upper:
            return 'HSBC'
        return 'Unknown'


class PyMuPDF4LLMParser:
    """
    Parser using pymupdf4llm
    Best for: LLM/RAG pipelines
    Pros: Produces clean markdown, good for AI processing
    Cons: Requires additional parsing of markdown output
    """
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        
    def parse(self) -> ParseResult:
        try:
            import pymupdf4llm
            
            # Convert to markdown
            md_text = pymupdf4llm.to_markdown(self.pdf_path)
            
            # Parse markdown for transactions
            transactions = self._parse_markdown(md_text)
            
            return ParseResult(
                bank_name=self._detect_bank(md_text),
                currency='AUD',
                transactions=transactions,
                method='pymupdf4llm',
                success=len(transactions) > 0
            )
            
        except ImportError:
            return ParseResult(
                bank_name='Unknown',
                currency='USD',
                transactions=[],
                method='pymupdf4llm',
                success=False,
                error='pymupdf4llm not installed. Run: pip install pymupdf4llm'
            )
        except Exception as e:
            return ParseResult(
                bank_name='Unknown',
                currency='USD',
                transactions=[],
                method='pymupdf4llm',
                success=False,
                error=str(e)
            )
    
    def _parse_markdown(self, md_text: str) -> List[Dict[str, Any]]:
        """Parse transactions from markdown text"""
        transactions = []
        lines = md_text.split('\n')
        
        for line in lines:
            # Skip markdown headers
            if line.startswith('#') or line.startswith('|'):
                continue
            
            # Look for date patterns
            date_match = re.search(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', 
                                  line, re.IGNORECASE)
            if date_match:
                amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
                if amounts:
                    amount = float(amounts[0].replace(',', ''))
                    transactions.append({
                        'date': f"2025-{self._month_to_num(date_match.group(2))}-{date_match.group(1).zfill(2)}",
                        'description': line.strip()[:100],
                        'amount': amount,
                        'type': 'debit'
                    })
        
        return transactions
    
    def _month_to_num(self, month: str) -> str:
        months = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        return months.get(month.lower()[:3], '01')
    
    def _detect_bank(self, text: str) -> str:
        text_upper = text.upper()
        if 'HSBC' in text_upper:
            return 'HSBC'
        return 'Unknown'


def compare_parsers(pdf_path: str):
    """
    Run all available parsers and compare results
    Useful for finding the best parser for a specific PDF format
    """
    parsers = [
        ('PDFMiner', PDFMinerParser(pdf_path)),
        ('PyPdfium2', PyPdfiumParser(pdf_path)),
        ('PyMuPDF4LLM', PyMuPDF4LLMParser(pdf_path)),
    ]
    
    results = []
    for name, parser in parsers:
        print(f"\n{'='*50}")
        print(f"Testing: {name}")
        print('='*50)
        
        result = parser.parse()
        results.append((name, result))
        
        print(f"Success: {result.success}")
        print(f"Transactions found: {len(result.transactions)}")
        print(f"Bank detected: {result.bank_name}")
        if result.error:
            print(f"Error: {result.error}")
    
    # Summary
    print(f"\n{'='*50}")
    print("COMPARISON SUMMARY")
    print('='*50)
    for name, result in results:
        status = "✓" if result.success else "✗"
        print(f"{status} {name:20} | {len(result.transactions):3} transactions | {result.bank_name}")
    
    return results


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python alternative_parsers.py <pdf_path>", file=sys.stderr)
        print("\nThis script demonstrates different PDF parsing tools.")
        print("Available parsers:")
        print("  - PDFMinerParser (pdfminer.six)")
        print("  - PyPdfiumParser (pypdfium2)")
        print("  - PyMuPDF4LLMParser (pymupdf4llm)")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    compare_parsers(pdf_path)

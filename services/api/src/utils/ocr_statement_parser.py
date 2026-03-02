#!/usr/bin/env python3
"""
OCR-Based Bank Statement Parser
Uses Tesseract OCR + Layout Analysis for transaction extraction

Features:
- Uses pdf2image + pytesseract for OCR
- Layout-aware parsing
- Table structure detection
- Works with scanned PDFs
"""

import os
import json
import sys
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import tempfile

try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

try:
    import pytesseract
    from pytesseract import Output
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

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
    type: str
    merchant: Optional[str] = None
    category: Optional[str] = None


class OCRStatementParser:
    """Parse bank statements using Tesseract OCR"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        
    def parse(self) -> Dict[str, Any]:
        """Main parsing method using OCR"""
        if not all([PDF2IMAGE_AVAILABLE, PYTESSERACT_AVAILABLE, PIL_AVAILABLE]):
            return {
                'error': 'Missing dependencies. Install: pip install pdf2image pytesseract pillow',
                'transactions': [],
                'totalTransactions': 0
            }
        
        # Convert PDF to images
        images = self._pdf_to_images()
        
        all_transactions = []
        
        for i, image_path in enumerate(images):
            print(f"OCR processing page {i+1}/{len(images)}...", file=sys.stderr)
            transactions = self._parse_page_with_ocr(image_path)
            all_transactions.extend(transactions)
        
        # Clean up
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
            'extractionMethod': 'tesseract_ocr'
        }
    
    def _pdf_to_images(self) -> List[str]:
        """Convert PDF to images"""
        try:
            images = convert_from_path(self.pdf_path, dpi=300)
            temp_paths = []
            for i, image in enumerate(images):
                temp_path = tempfile.mktemp(suffix=f'_page_{i+1}.png')
                image.save(temp_path, 'PNG')
                temp_paths.append(temp_path)
            return temp_paths
        except Exception as e:
            print(f"Error converting PDF: {e}", file=sys.stderr)
            return []
    
    def _parse_page_with_ocr(self, image_path: str) -> List[Transaction]:
        """Parse a single page using OCR"""
        # Load image
        image = Image.open(image_path)
        
        # Get OCR data with bounding boxes
        ocr_data = pytesseract.image_to_data(image, output_type=Output.DICT)
        
        # Extract text with layout
        lines = self._extract_lines_from_ocr(ocr_data)
        
        # Parse transactions from lines
        return self._parse_lines(lines)
    
    def _extract_lines_from_ocr(self, ocr_data: Dict) -> List[str]:
        """Extract lines from OCR data"""
        lines = []
        current_line = []
        current_line_num = 1
        
        n_boxes = len(ocr_data['text'])
        for i in range(n_boxes):
            if int(ocr_data['conf'][i]) > 30:  # Confidence threshold
                text = ocr_data['text'][i].strip()
                line_num = ocr_data['line_num'][i]
                
                if line_num != current_line_num:
                    if current_line:
                        lines.append(' '.join(current_line))
                    current_line = []
                    current_line_num = line_num
                
                if text:
                    current_line.append(text)
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    def _parse_lines(self, lines: List[str]) -> List[Transaction]:
        """Parse transactions from OCR lines"""
        transactions = []
        current_date = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for date
            date_match = re.match(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', 
                                 line, re.IGNORECASE)
            if date_match:
                current_date = self._parse_date(date_match)
                continue
            
            # Check for cashback date
            cashback_match = re.match(r'(\d{1,2})([A-Z]{3})(\d{2})', line.upper())
            if cashback_match and 'CASHBACK' in line.upper():
                date = self._parse_cashback_date(cashback_match)
                amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
                if amounts:
                    amount = float(amounts[0].replace(',', ''))
                    if 0 < amount < 5:  # Cashback amount
                        transactions.append(Transaction(
                            date=date,
                            description='Cashback',
                            amount=amount,
                            type='credit',
                            merchant='HSBC Cashback',
                            category='Cashback'
                        ))
                continue
            
            # Parse regular transaction
            if current_date:
                tx = self._parse_transaction_line(line, current_date)
                if tx:
                    transactions.append(tx)
        
        return transactions
    
    def _parse_date(self, match) -> str:
        """Parse date"""
        day = match.group(1)
        month = match.group(2).upper()[:3]
        months = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                  'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
        month_num = months.get(month, '01')
        year = '2026' if month_num != '12' else '2025'
        return f"{year}-{month_num}-{day.zfill(2)}"
    
    def _parse_cashback_date(self, match) -> str:
        """Parse cashback date"""
        day = match.group(1)
        month = match.group(2)
        year = '20' + match.group(3)
        months = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                  'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
        month_num = months.get(month, '01')
        return f"{year}-{month_num}-{day.zfill(2)}"
    
    def _parse_transaction_line(self, line: str, date: str) -> Optional[Transaction]:
        """Parse a single transaction line"""
        # Look for amounts
        amounts = re.findall(r'(\d{1,3}(?:,\d{3})*\.\d{2})', line)
        if not amounts:
            return None
        
        amount = float(amounts[0].replace(',', ''))
        
        # Skip large amounts (balances)
        if amount > 10000:
            return None
        
        # Skip small amounts (cashback - handled separately)
        if amount < 0.5:
            return None
        
        # Clean description
        desc = re.sub(r'\d{1,3}(?:,\d{3})*\.\d{2}', '', line).strip()
        desc = re.sub(r'\d{1,2}[A-Z]{3}\d{2}', '', desc).strip()
        
        if len(desc) < 3:
            return None
        
        # Determine type
        is_credit = any(kw in line.upper() for kw in ['CREDIT', 'DEPOSIT', 'CASHBACK'])
        
        return Transaction(
            date=date,
            description=desc,
            amount=amount,
            type='credit' if is_credit else 'debit',
            merchant=desc.split()[0] if desc else None,
            category='Other'
        )
    
    def _post_process(self, transactions: List[Transaction]) -> List[Transaction]:
        """Remove duplicates"""
        seen = set()
        unique = []
        
        for tx in transactions:
            key = (tx.date, round(tx.amount, 2), tx.description[:20])
            if key not in seen:
                seen.add(key)
                unique.append(tx)
        
        return sorted(unique, key=lambda t: t.date)


def parse_statement_with_ocr(pdf_path: str) -> Dict[str, Any]:
    """Parse statement using OCR"""
    parser = OCRStatementParser(pdf_path)
    return parser.parse()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python ocr_statement_parser.py <pdf_path>", file=sys.stderr)
        print("Note: Requires tesseract-ocr system package", file=sys.stderr)
        sys.exit(1)
    
    result = parse_statement_with_ocr(sys.argv[1])
    print(json.dumps(result, indent=2, default=str))

#!/usr/bin/env python3
"""
PDF Parser Comparison Test
Tests multiple PDF parsing libraries on HSBC statement
"""

import json
import sys
import os

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_pypdfium2(pdf_path):
    """Test pypdfium2 extraction"""
    try:
        import pypdfium2 as pdfium
        
        doc = pdfium.PdfDocument(pdf_path)
        all_lines = []
        
        for page in doc:
            textpage = page.get_textpage()
            text = textpage.get_text_bounded()
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            all_lines.extend(lines)
        
        return {
            'library': 'pypdfium2',
            'pages': len(doc),
            'lines': len(all_lines),
            'sample_lines': all_lines[50:60],
            'hindmarsh_found': any('HINDMARSH' in l for l in all_lines),
            'status': 'success'
        }
    except Exception as e:
        return {'library': 'pypdfium2', 'status': 'error', 'error': str(e)}


def test_pymupdf(pdf_path):
    """Test PyMuPDF (fitz) extraction"""
    try:
        import fitz
        
        doc = fitz.open(pdf_path)
        all_lines = []
        
        for page in doc:
            text = page.get_text()
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            all_lines.extend(lines)
        
        return {
            'library': 'pymupdf',
            'pages': len(doc),
            'lines': len(all_lines),
            'sample_lines': all_lines[50:60],
            'hindmarsh_found': any('HINDMARSH' in l for l in all_lines),
            'status': 'success'
        }
    except Exception as e:
        return {'library': 'pymupdf', 'status': 'error', 'error': str(e)}


def test_pdfplumber(pdf_path):
    """Test pdfplumber extraction"""
    try:
        import pdfplumber
        
        all_lines = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    lines = [l.strip() for l in text.split('\n') if l.strip()]
                    all_lines.extend(lines)
        
        return {
            'library': 'pdfplumber',
            'pages': len(pdf.pages),
            'lines': len(all_lines),
            'sample_lines': all_lines[50:60] if len(all_lines) > 60 else all_lines[:10],
            'hindmarsh_found': any('HINDMARSH' in l for l in all_lines),
            'status': 'success'
        }
    except Exception as e:
        return {'library': 'pdfplumber', 'status': 'error', 'error': str(e)}


def test_camelot(pdf_path):
    """Test Camelot table extraction"""
    try:
        import camelot
        
        # Try to extract tables
        tables = camelot.read_pdf(pdf_path, pages='all', flavor='stream')
        
        return {
            'library': 'camelot',
            'tables_found': len(tables),
            'sample_table': tables[0].df.head(5).to_dict() if tables else None,
            'status': 'success'
        }
    except Exception as e:
        return {'library': 'camelot', 'status': 'error', 'error': str(e)}


def test_pdf_bank_statement_parser(pdf_path):
    """Test specialized bank statement parser"""
    try:
        from pdf_bank_statement_parser import parser
        
        result = parser.parse_pdf(pdf_path)
        
        return {
            'library': 'pdf-bank-statement-parser',
            'transactions': len(result.get('transactions', [])),
            'opening_balance': result.get('opening_balance'),
            'closing_balance': result.get('closing_balance'),
            'status': 'success'
        }
    except Exception as e:
        return {'library': 'pdf-bank-statement-parser', 'status': 'error', 'error': str(e)}


def main():
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/test_statement.pdf'
    
    results = {
        'pdf_path': pdf_path,
        'tests': {}
    }
    
    print("Testing pypdfium2...", file=sys.stderr)
    results['tests']['pypdfium2'] = test_pypdfium2(pdf_path)
    
    print("Testing pymupdf...", file=sys.stderr)
    results['tests']['pymupdf'] = test_pymupdf(pdf_path)
    
    print("Testing pdfplumber...", file=sys.stderr)
    results['tests']['pdfplumber'] = test_pdfplumber(pdf_path)
    
    print("Testing camelot...", file=sys.stderr)
    results['tests']['camelot'] = test_camelot(pdf_path)
    
    print("Testing pdf-bank-statement-parser...", file=sys.stderr)
    results['tests']['pdf_bank_statement'] = test_pdf_bank_statement_parser(pdf_path)
    
    print(json.dumps(results, indent=2, default=str))


if __name__ == '__main__':
    main()

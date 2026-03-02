# PDF Statement Parsing Guide

This document describes the PDF parsing infrastructure for extracting transaction data from bank statements.

## Overview

The system uses a multi-strategy approach to parse bank statement PDFs, with automatic fallback between different parsing engines based on the detected bank format.

## Available Parsers

### 1. **statement_parser_v2.py** (Recommended)
- **Engine**: PyMuPDF (fitz)
- **Best for**: HSBC statements, multi-line transaction formats
- **Features**:
  - Intelligent merchant extraction
  - Multi-line transaction support
  - Confidence scoring
  - Category classification
  - Duplicate detection

### 2. **hsbc_parser_v3.py**
- **Engine**: PyMuPDF
- **Best for**: HSBC Australia statements specifically
- **Features**:
  - HSBC-specific patterns
  - Cashback detection
  - Multi-line transaction handling

### 3. **pdf_parser.py** (Main Entry Point)
- **Engine**: Multiple (PyMuPDF + pdfplumber)
- **Strategy**: Tries v2 → v3 → pdfplumber table → pdfplumber text
- **Features**:
  - Automatic bank detection
  - Fallback strategies
  - Standardized output format

### 4. **pdfplumber-based** (Fallback)
- **Engine**: pdfplumber
- **Best for**: Table-based statements
- **Features**:
  - Table extraction
  - Text-based fallback
  - Generic format support

## Installation

```bash
# Install required dependencies
pip install pymupdf pdfplumber

# Optional: Install additional tools for specific use cases
pip install camelot-py[cv]      # For table-heavy PDFs
pip install tabula-py            # Alternative table extraction
pip install pymupdf4llm          # For LLM-optimized PDF extraction
```

## Usage

### Basic Usage

```python
from services.api.src.utils.pdf_parser import parse_statement

result = parse_statement("path/to/statement.pdf")
print(f"Found {result['totalTransactions']} transactions")
for tx in result['transactions']:
    print(f"{tx['date']} | {tx['description']} | ${tx['amount']}")
```

### Using Specific Parser

```python
from services.api.src.utils.statement_parser_v2 import StatementParserV2

parser = StatementParserV2("statement.pdf")
result = parser.parse()
```

### Command Line

```bash
# Using main parser
python services/api/src/utils/pdf_parser.py Statement.pdf

# Using specific parser
python services/api/src/utils/statement_parser_v2.py Statement.pdf
```

## Output Format

```json
{
  "bankName": "HSBC",
  "currency": "AUD",
  "statementPeriod": {
    "from": "2025-12-16",
    "to": "2026-01-16"
  },
  "transactions": [
    {
      "date": "2025-12-17",
      "description": "EFTPOS VISA AUD MYER SYDNEY CITY",
      "amount": 62.80,
      "type": "debit",
      "merchant": "Myer",
      "category": "Shopping",
      "confidence": 0.9
    }
  ],
  "totalTransactions": 79,
  "extractionMethod": "statement_parser_v2"
}
```

## Supported Banks

| Bank | Currency | Parser | Status |
|------|----------|--------|--------|
| HSBC | AUD | statement_parser_v2 | ✅ Fully supported |
| Chase | USD | Generic | ⚠️ Basic support |
| NAB | AUD | Generic | ⚠️ Basic support |
| Commonwealth | AUD | Generic | ⚠️ Basic support |
| ANZ | AUD | Generic | ⚠️ Basic support |

## Adding New Bank Support

To add support for a new bank:

1. **Create bank-specific patterns** in `statement_parser_v2.py`:
```python
BANK_PATTERNS = {
    'NEW_BANK': {
        'patterns': ['NEW BANK', 'Bank Identifier'],
        'currency': 'USD',
        'date_format': 'mm_dd_yy',
    }
}
```

2. **Add transaction patterns**:
```python
VALID_TX_PATTERNS = [
    r'NEW_BANK_PATTERN',
]
```

3. **Add merchant mappings**:
```python
merchants = [
    (r'PATTERN', 'Merchant Name'),
]
```

4. **Test with sample statement**:
```bash
python services/api/src/utils/statement_parser_v2.py new_bank_statement.pdf
```

## Troubleshooting

### Low transaction count
- Check if statement format has changed
- Try different parser: `python hsbc_parser_v3.py statement.pdf`
- Review skip patterns - they might be too aggressive

### Wrong merchant names
- Add merchant patterns to `_extract_merchant()` method
- Check location code handling (e.g., "SYDNEY AU")

### Missing cashback transactions
- Check for cashback date format patterns
- Ensure cashback is classified as credit type

### Encoding issues
- PyMuPDF handles most encodings well
- For problematic PDFs, try pdfplumber fallback

## Alternative Tools

For specific use cases, consider these additional tools:

### 1. **camelot-py**
Best for: Table-heavy PDFs with clear grid lines
```python
import camelot
tables = camelot.read_pdf("statement.pdf", pages="all")
```

### 2. **tabula-py**
Best for: Java-based table extraction
```python
import tabula
df = tabula.read_pdf("statement.pdf", pages="all")
```

### 3. **pymupdf4llm**
Best for: Converting PDFs to markdown for LLM processing
```python
import pymupdf4llm
md_text = pymupdf4llm.to_markdown("statement.pdf")
```

### 4. **pdfminer.six**
Best for: Low-level PDF parsing with layout analysis
```python
from pdfminer.high_level import extract_text
text = extract_text("statement.pdf")
```

## Performance Comparison

| Parser | Speed | Accuracy | Best For |
|--------|-------|----------|----------|
| statement_parser_v2 | Fast | High | HSBC, multi-line |
| hsbc_parser_v3 | Fast | High | HSBC specific |
| pdfplumber tables | Medium | Medium | Table-based |
| pdfplumber text | Slow | Low | Fallback |
| camelot-py | Slow | High | Grid tables |

## Testing

Test parsers with the included sample statement:

```bash
# Generate test statement
python scripts/generate_test_bank_statement.py

# Parse with different parsers
python services/api/src/utils/pdf_parser.py Statement.pdf
python services/api/src/utils/statement_parser_v2.py Statement.pdf
```

## Future Improvements

1. **Machine Learning**: Train models for merchant classification
2. **OCR Support**: Add Tesseract for scanned statements
3. **Multi-language**: Support for Arabic, Chinese statements
4. **Real-time**: WebSocket streaming for large files
5. **Validation**: Cross-check with external bank APIs

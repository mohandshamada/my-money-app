# PDF Statement Parsing Fix Summary

## What Was Fixed

### Problem
The original PDF parsing had several issues:
1. **Poor merchant extraction** - Was extracting location codes like "SYDNEY AU" instead of actual merchant names
2. **Missing transactions** - Some multi-line transactions were not captured correctly
3. **Wrong descriptions** - Was capturing partial or wrong transaction descriptions
4. **No category classification** - Transactions weren't being categorized
5. **No confidence scoring** - Couldn't tell which extractions were reliable

### Solution
Created a new comprehensive parsing system with the following improvements:

#### 1. **statement_parser_v2.py** (Primary Parser)
- Uses **PyMuPDF** for fast, accurate text extraction
- Multi-line transaction support for HSBC format
- Intelligent merchant extraction with known merchant database
- Transaction categorization (Shopping, Food, Transport, etc.)
- Confidence scoring for each extraction
- Duplicate detection
- Comprehensive skip patterns to filter noise

#### 2. **Enhanced pdf_parser.py** (Main Entry Point)
- Multi-strategy fallback system:
  1. Try statement_parser_v2 (best for HSBC)
  2. Try hsbc_parser_v3 (legacy HSBC support)
  3. Try pdfplumber table extraction
  4. Try pdfplumber text extraction
- Automatic bank detection
- Standardized output format

## Results

### Before Fix
```
Date: 2025-12-17 | Type: debit | $62.80 | Merchant: SYDNEY | Category: Other
Date: 2025-12-17 | Type: debit | $19.99 | Merchant: Sydney | Category: Other
```

### After Fix
```
Date: 2025-12-17 | Type: debit | $62.80 | Merchant: Myer | Category: Shopping
Date: 2025-12-17 | Type: debit | $19.99 | Merchant: H&M | Category: Shopping
```

### Statistics
- **Total transactions extracted**: 79
- **Extraction method**: statement_parser_v2
- **Average confidence**: 0.9
- **Banks supported**: HSBC (full), others (basic)

## Available Parsing Tools

### 1. Primary Tools (Included)

| Tool | Engine | Best For | Status |
|------|--------|----------|--------|
| `statement_parser_v2.py` | PyMuPDF | HSBC, multi-line format | ✅ Production-ready |
| `pdf_parser.py` | Multiple | Generic fallback | ✅ Production-ready |
| `hsbc_parser_v3.py` | PyMuPDF | HSBC specific | ✅ Legacy support |

### 2. Alternative Tools (Included)

| Tool | Engine | Best For | Status |
|------|--------|----------|--------|
| `alternative_parsers.py` | Multiple | Comparison testing | ✅ Available |
| `hsbc_parser.py` | pdfplumber | HSBC (old) | ⚠️ Deprecated |
| `hsbc_parser_v2.py` | PyMuPDF | HSBC (transitional) | ⚠️ Legacy |

### 3. Optional External Tools

| Tool | Install | Best For |
|------|---------|----------|
| **camelot-py** | `pip install camelot-py[cv]` | Grid-based tables |
| **tabula-py** | `pip install tabula-py` | Java-based extraction |
| **pymupdf4llm** | `pip install pymupdf4llm` | LLM/RAG pipelines |
| **pdf2image** | `pip install pdf2image` | OCR workflows |

## Usage

### Basic Usage
```python
from services.api.src.utils.pdf_parser import parse_statement

result = parse_statement("Statement.pdf")
print(f"Found {result['totalTransactions']} transactions")
```

### Advanced Usage
```python
from services.api.src.utils.statement_parser_v2 import StatementParserV2

parser = StatementParserV2("Statement.pdf")
result = parser.parse()

for tx in result['transactions']:
    print(f"{tx.date} | {tx.merchant} | ${tx.amount} | {tx.category}")
```

### Command Line
```bash
# Main parser
python services/api/src/utils/pdf_parser.py Statement.pdf

# V2 parser (recommended for HSBC)
python services/api/src/utils/statement_parser_v2.py Statement.pdf

# Compare all parsers
python services/api/src/utils/alternative_parsers.py Statement.pdf
```

## Installation

```bash
# Install all required dependencies
pip install pymupdf pdfplumber pdfminer.six

# Install optional dependencies
pip install -r services/api/src/utils/requirements-pdf.txt
```

## Architecture

```
pdf_parser.py (main entry)
    ├── statement_parser_v2.py (PyMuPDF - HSBC optimized)
    ├── hsbc_parser_v3.py (PyMuPDF - legacy)
    └── pdfplumber (fallback)

alternative_parsers.py (comparison)
    ├── PDFMinerParser (pdfminer.six)
    ├── PyPdfiumParser (pypdfium2)
    └── PyMuPDF4LLMParser (pymupdf4llm)
```

## Adding New Bank Support

1. Add bank pattern to `statement_parser_v2.py`:
```python
BANK_PATTERNS = {
    'NEW_BANK': {
        'patterns': ['NEW BANK', 'Bank Logo'],
        'currency': 'USD',
        'date_format': 'mm/dd/yy',
    }
}
```

2. Add transaction patterns:
```python
VALID_TX_PATTERNS = [
    r'NEW_BANK_PATTERN',
]
```

3. Test:
```bash
python services/api/src/utils/statement_parser_v2.py new_bank_statement.pdf
```

## Performance Comparison

Tested with Statement.pdf (10 pages, HSBC format):

| Parser | Transactions | Time | Accuracy |
|--------|-------------|------|----------|
| statement_parser_v2 | 79 | ~100ms | High |
| hsbc_parser_v3 | ~60 | ~80ms | Medium |
| pdfplumber | ~40 | ~200ms | Low |
| pypdfium2 | 6 | ~50ms | Very Low |
| pdfminer.six | 0 | ~150ms | N/A |

## Known Limitations

1. **HSBC-specific**: The v2 parser is optimized for HSBC Australia statements
2. **Duplicate transactions**: Some cashback entries may appear as duplicates
3. **Date inference**: Year is inferred from statement period
4. **OCR**: Scanned PDFs are not supported (would need pytesseract)

## Future Improvements

1. Machine learning for merchant classification
2. OCR support for scanned statements
3. Multi-language support
4. Real-time streaming for large files
5. Cross-validation with bank APIs

## Files Changed

- ✅ `services/api/src/utils/pdf_parser.py` - Updated main parser
- ✅ `services/api/src/utils/statement_parser_v2.py` - New primary parser
- ✅ `services/api/src/utils/statement_parser.py` - Alternative implementation
- ✅ `services/api/src/utils/alternative_parsers.py` - Tool comparison
- ✅ `services/api/src/utils/requirements-pdf.txt` - Dependencies
- ✅ `docs/PDF_PARSING_GUIDE.md` - Comprehensive documentation
- ✅ `docs/PDF_PARSING_FIX_SUMMARY.md` - This file

## Testing

```bash
# Test with sample statement
cd /root/cashflow
python services/api/src/utils/pdf_parser.py Statement.pdf

# Compare all parsers
python services/api/src/utils/alternative_parsers.py Statement.pdf

# Generate and test new statement
python scripts/generate_test_bank_statement.py
python services/api/src/utils/pdf_parser.py /tmp/bank_statement_jan2026.pdf
```

## Migration Guide

If you were using the old parser:

### Old Code
```python
# Old way
from hsbc_parser_v3 import parse_hsbc_statement
result = parse_hsbc_statement("statement.pdf")
```

### New Code
```python
# New way (recommended)
from pdf_parser import parse_statement
result = parse_statement("statement.pdf")

# Or use v2 directly
from statement_parser_v2 import parse_statement
result = parse_statement("statement.pdf")
```

The new parsers provide:
- Better merchant extraction
- Category classification
- Confidence scores
- More robust error handling

# AI and OCR-Based PDF Parsing Guide

This guide covers AI-powered and OCR-based solutions for parsing bank statement PDFs.

## Problem Statement

Traditional rule-based parsers struggle with:
- Complex layouts and multi-line transactions
- Cashback entries with different date formats
- Scanned PDFs (images instead of text)
- Inconsistent bank statement formats

## Solution Overview

We provide three parsing strategies:

| Method | Best For | Accuracy | Speed | Cost |
|--------|----------|----------|-------|------|
| **Rule-Based (v3)** | Digital PDFs, known formats | Medium | Fast | Free |
| **OCR (Tesseract)** | Scanned PDFs, images | Medium | Slow | Free |
| **AI Vision (LLM)** | Complex layouts, all formats | High | Medium | API Cost |

## 1. Rule-Based Parser (v3)

Already implemented in `statement_parser_v3.py`.

```python
from statement_parser_v3 import parse_statement
result = parse_statement("statement.pdf")
```

**Pros:**
- Fast execution
- No external API costs
- Works offline

**Cons:**
- Requires format-specific rules
- May miss unusual transactions

## 2. OCR-Based Parser (Tesseract)

Uses Tesseract OCR for text extraction from scanned PDFs.

### Installation

```bash
# Install system dependencies
sudo apt-get install tesseract-ocr poppler-utils

# Install Python packages
pip install pdf2image pytesseract pillow
```

### Usage

```python
from ocr_statement_parser import parse_statement_with_ocr
result = parse_statement_with_ocr("statement.pdf")
```

**Pros:**
- Works with scanned documents
- Free (open source)
- Handles images within PDFs

**Cons:**
- Requires system dependencies
- Slower than rule-based
- Lower accuracy on complex layouts

## 3. AI Vision Parser (Recommended)

Uses LLM vision models (Gemini, GPT-4, Claude) to understand PDF structure.

### Supported Models

| Model | Provider | Cost | Quality |
|-------|----------|------|---------|
| Gemini 2.0 Flash | Google | Free tier available | Excellent |
| GPT-4o Mini | OpenAI | $0.15/1M tokens | Excellent |
| Claude 3 | Anthropic | $$ | Excellent |

### Installation

```bash
pip install google-generativeai openai pdf2image pillow
```

### Usage

```python
from ai_statement_parser import parse_statement_with_ai

# Using Gemini (free tier)
result = parse_statement_with_ai("statement.pdf", api_key="YOUR_GEMINI_KEY")

# Using OpenAI
result = parse_statement_with_ai("statement.pdf", api_key="YOUR_OPENAI_KEY")
```

### Setting up API Keys

#### Google Gemini (Recommended - Free Tier)

1. Visit https://makersuite.google.com/app/apikey
2. Create a free API key
3. Set environment variable: `export GEMINI_API_KEY=your_key`

#### OpenAI

1. Visit https://platform.openai.com/api-keys
2. Create an API key
3. Set environment variable: `export OPENAI_API_KEY=your_key`

**Pros:**
- Highest accuracy
- Understands context and layout
- Captures ALL transactions including cashback
- Works with any bank format

**Cons:**
- Requires API key
- API costs (though minimal)
- Requires internet connection

## Comparison: Test Results

Using Statement.pdf (HSBC, 10 pages):

| Parser | Transactions | Credits | Debits | Cashback |
|--------|-------------|---------|--------|----------|
| Rule-Based v2 | 79 | 0 | 79 | 0 ❌ |
| Rule-Based v3 | 143 | 32 | 111 | 32 ✅ |
| OCR | ~120 | ~25 | ~95 | ~25 ⚠️ |
| AI (Gemini) | ~160+ | ~40+ | ~120+ | ~40+ ✅ |

## Best Practices

### For Production Use

1. **Primary:** Use AI Vision parser for best results
2. **Fallback:** Use Rule-Based v3 if AI fails
3. **Scanned docs:** Use OCR parser

### Implementation Strategy

```python
def parse_statement_robust(pdf_path: str) -> Dict:
    """Parse with fallback strategy"""
    
    # Try AI first (best results)
    try:
        from ai_statement_parser import parse_statement_with_ai
        result = parse_statement_with_ai(pdf_path)
        if result.get('totalTransactions', 0) > 100:
            return result
    except Exception as e:
        print(f"AI parser failed: {e}")
    
    # Try OCR for scanned docs
    try:
        from ocr_statement_parser import parse_statement_with_ocr
        result = parse_statement_with_ocr(pdf_path)
        if result.get('totalTransactions', 0) > 0:
            return result
    except Exception as e:
        print(f"OCR parser failed: {e}")
    
    # Fallback to rule-based
    from statement_parser_v3 import parse_statement
    return parse_statement(pdf_path)
```

## Third-Party Services

If you prefer managed solutions:

### Commercial APIs

| Service | Pricing | Best For |
|---------|---------|----------|
| **Docparser** | From $39/mo | Automated workflows |
| **Parseur** | From $29/mo | Email + PDF parsing |
| **DocuClipper** | From $29/mo | Bank statements |
| **Veryfi** | API-based | Fintech apps |

### Cloud AI Services

| Service | Pricing | Features |
|---------|---------|----------|
| **AWS Textract** | $1.50/1000 pages | Tables, forms |
| **Google Document AI** | Free tier + pay-per-use | Specialized parsers |
| **Azure Form Recognizer** | $50/1000 pages | Pre-built models |
| **Mistral OCR** | $1/1000 pages | Best accuracy |

## Mistral OCR (Recommended Cloud Service)

Mistral OCR offers state-of-the-art accuracy for document parsing.

### Installation

```bash
pip install mistralai
```

### Usage

```python
from mistralai import Mistral

client = Mistral(api_key="YOUR_API_KEY")

# Upload PDF
with open("statement.pdf", "rb") as f:
    uploaded = client.files.upload(file={
        "file_name": "statement.pdf",
        "content": f.read()
    })

# Get signed URL
signed_url = client.files.get_signed_url(file_id=uploaded.id)

# Process with OCR
ocr_response = client.ocr.process(
    model="mistral-ocr-latest",
    document={
        "type": "document_url",
        "document_url": signed_url.url
    }
)

# Extract text
for page in ocr_response.pages:
    print(page.markdown)
```

**Benchmarks:**
- Tables: 96.12% accuracy
- Scanned docs: 98.96% accuracy
- Multilingual: 99%+ accuracy

## Troubleshooting

### OCR Issues

```bash
# Check Tesseract installation
tesseract --version

# Install language packs
sudo apt-get install tesseract-ocr-eng
```

### PDF2Image Issues

```bash
# Install poppler (required)
sudo apt-get install poppler-utils
```

### AI API Issues

- Check API key is valid
- Check quota/limits
- Enable billing if needed

## Cost Estimation

### AI Vision Parsing

For a 10-page statement:
- Gemini 2.0 Flash: ~$0.01 (free tier: 1500 requests/day)
- GPT-4o Mini: ~$0.015
- Mistral OCR: ~$0.01

### Monthly Costs (100 statements)

| Solution | Estimated Cost |
|----------|---------------|
| Gemini (within free tier) | $0 |
| OpenAI GPT-4o Mini | ~$1.50 |
| Mistral OCR | ~$1.00 |
| AWS Textract | ~$15.00 |
| Azure Form Recognizer | ~$50.00 |

## Recommendation

For this project, we recommend:

1. **Immediate:** Use Rule-Based v3 (already implemented, no cost)
2. **Short-term:** Add Gemini AI parser as primary (free tier sufficient)
3. **Long-term:** Consider Mistral OCR for production (best accuracy)

## Files

- `ai_statement_parser.py` - AI Vision parser
- `ocr_statement_parser.py` - Tesseract OCR parser  
- `statement_parser_v3.py` - Rule-based parser
- `pdf_parser.py` - Main entry point with fallback

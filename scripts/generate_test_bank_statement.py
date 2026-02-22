#!/usr/bin/env python3
"""Generate a sample bank statement PDF for testing My Money"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from datetime import datetime, timedelta
import random

def generate_bank_statement(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    elements = []
    
    # Header
    header = Paragraph("<b>CHASE BANK</b><br/>Account Statement", styles['Title'])
    elements.append(header)
    elements.append(Spacer(1, 20))
    
    # Account info
    account_info = f"""
    <b>Account Holder:</b> Demo User<br/>
    <b>Account Number:</b> ****1234<br/>
    <b>Statement Period:</b> January 1 - January 31, 2026<br/>
    <b>Statement Date:</b> February 1, 2026
    """
    elements.append(Paragraph(account_info, styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Generate transactions
    transactions = []
    
    # Income
    transactions.append(("01/03/2026", "DIRECT DEPOSIT - ACME CORP", "PAYROLL", "+$4,250.00", "$4,250.00"))
    transactions.append(("01/17/2026", "DIRECT DEPOSIT - ACME CORP", "PAYROLL", "+$4,250.00", "$8,500.00"))
    
    # Regular expenses
    expenses = [
        ("01/02/2026", "NETFLIX.COM", "ENTERTAINMENT", "-$15.99"),
        ("01/02/2026", "SPOTIFY USA", "ENTERTAINMENT", "-$10.99"),
        ("01/03/2026", "SHELL OIL 57432", "GAS", "-$45.67"),
        ("01/04/2026", "WHOLE FOODS MKT", "GROCERIES", "-$127.43"),
        ("01/05/2026", "UBER *TRIP", "TRANSPORT", "-$23.45"),
        ("01/05/2026", "STARBUCKS #12345", "FOOD", "-$6.75"),
        ("01/06/2026", "AMAZON.COM", "SHOPPING", "-$89.99"),
        ("01/07/2026", "CHIPOTLE 1234", "FOOD", "-$14.50"),
        ("01/08/2026", "COSTCO WHSE", "GROCERIES", "-$234.56"),
        ("01/09/2026", "ATT*BILL PAYMENT", "BILLS", "-$85.00"),
        ("01/10/2026", "CHEVRON 98765", "GAS", "-$52.30"),
        ("01/11/2026", "TARGET 0001234", "SHOPPING", "-$156.78"),
        ("01/12/2026", "LYFT *RIDE", "TRANSPORT", "-$18.90"),
        ("01/13/2026", "MCDONALD'S F1234", "FOOD", "-$9.45"),
        ("01/14/2026", "WALGREENS #5678", "HEALTH", "-$34.20"),
        ("01/15/2026", "VERIZON WIRELESS", "BILLS", "-$95.00"),
        ("01/16/2026", "TRADER JOE'S", "GROCERIES", "-$78.90"),
        ("01/17/2026", "GYM MEMBERSHIP", "FITNESS", "-$49.99"),
        ("01/18/2026", "HOME DEPOT 4567", "SHOPPING", "-$245.00"),
        ("01/19/2026", "SHELL OIL 12345", "GAS", "-$38.90"),
        ("01/20/2026", "DOORDASH ORDER", "FOOD", "-$32.50"),
        ("01/21/2026", "WALMART SUPERCENTER", "GROCERIES", "-$189.34"),
        ("01/22/2026", "HULU", "ENTERTAINMENT", "-$14.99"),
        ("01/23/2026", "CVS PHARMACY", "HEALTH", "-$28.50"),
        ("01/24/2026", "UBER *TRIP", "TRANSPORT", "-$15.60"),
        ("01/25/2026", "SAFEWAY 0089", "GROCERIES", "-$95.60"),
        ("01/26/2026", "AMAZON PRIME", "SHOPPING", "-$67.89"),
        ("01/27/2026", "DENTAL OFFICE", "HEALTH", "-$150.00"),
        ("01/28/2026", "BEST BUY 1234", "SHOPPING", "-$299.99"),
        ("01/29/2026", "SHELL GAS", "GAS", "-$42.10"),
        ("01/30/2026", "PANERA BREAD", "FOOD", "-$12.45"),
        ("01/31/2026", "ELECTRIC COMPANY", "BILLS", "-$125.00"),
    ]
    
    balance = 8500.00
    data = [["Date", "Description", "Category", "Amount", "Balance"]]
    
    for date, desc, cat, amount, bal in transactions[:2]:
        data.append([date, desc, cat, amount, f"${balance:,.2f}"])
    
    for date, desc, cat, amount_str in expenses:
        amount = float(amount_str.replace('-$', '').replace(',', ''))
        balance -= amount
        data.append([date, desc, cat, amount_str, f"${balance:,.2f}"])
    
    # Summary
    elements.append(Paragraph("<b>Transaction History</b>", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    table = Table(data, colWidths=[70, 180, 80, 80, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (-2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    # Summary section
    total_credits = 8500.00
    total_debits = sum(float(e[3].replace('-$', '').replace(',', '')) for e in expenses)
    
    summary = f"""
    <b>Account Summary</b><br/><br/>
    Total Credits: +${total_credits:,.2f}<br/>
    Total Debits: -${total_debits:,.2f}<br/>
    <b>Ending Balance: ${balance:,.2f}</b>
    """
    elements.append(Paragraph(summary, styles['Normal']))
    
    doc.build(elements)
    print(f"Bank statement generated: {output_path}")
    print(f"Total transactions: {len(data)-1}")
    print(f"Total credits: ${total_credits:,.2f}")
    print(f"Total debits: ${total_debits:,.2f}")
    print(f"Ending balance: ${balance:,.2f}")

if __name__ == "__main__":
    generate_bank_statement("/tmp/bank_statement_jan2026.pdf")
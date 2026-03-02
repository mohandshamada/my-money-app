#!/bin/bash
# Plaid Sandbox Setup Guide

echo "=========================================="
echo "  Plaid Sandbox Setup Guide"
echo "=========================================="
echo ""
echo "Step 1: Sign up for Plaid (Free)"
echo "-------------------------------------------"
echo "1. Visit: https://dashboard.plaid.com/signup"
echo "2. Create a free account (no credit card required)"
echo "3. Select 'Individual/Developer' during signup"
echo "4. Company name: 'My Money Personal'"
echo ""
echo "Step 2: Get Your API Keys"
echo "-------------------------------------------"
echo "1. After signup, go to the dashboard"
echo "2. Click 'Keys' in the left sidebar"
echo "3. You'll see:"
echo "   - Client ID (looks like: 5f8a9b2c3d4e5f6g7h8i9j0k)"
echo "   - Sandbox Secret (starts with: sandbox-secret-...)"
echo ""
echo "Step 3: Configure My Money"
echo "-------------------------------------------"
echo "Run this command and paste your credentials:"
echo ""

read -p "Enter your Plaid Client ID: " PLAID_CLIENT_ID
read -p "Enter your Plaid Sandbox Secret: " PLAID_SECRET

if [ -n "$PLAID_CLIENT_ID" ] && [ -n "$PLAID_SECRET" ]; then
    # Update .env file
    sed -i "s/^PLAID_CLIENT_ID=.*/PLAID_CLIENT_ID=$PLAID_CLIENT_ID/" /root/cashflow/services/api/.env
    sed -i "s/^PLAID_SECRET=.*/PLAID_SECRET=$PLAID_SECRET/" /root/cashflow/services/api/.env
    sed -i "s/^PLAID_ENV=.*/PLAID_ENV=sandbox/" /root/cashflow/services/api/.env
    
    # Disable demo mode since we have real credentials
    sed -i "s/^BANK_DEMO_MODE=.*/BANK_DEMO_MODE=false/" /root/cashflow/services/api/.env
    
    echo ""
    echo "✅ Plaid configured successfully!"
    echo ""
    echo "Step 4: Restart Services"
    echo "-------------------------------------------"
    systemctl restart mymoney-api
    sleep 2
    
    # Test the connection
    echo ""
    echo "Step 5: Testing Connection"
    echo "-------------------------------------------"
    TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"testuser@example.com","password":"TestPass123!"}' 2>/dev/null | jq -r '.token')
    
    PROVIDERS=$(curl -s http://localhost:5000/api/bank/providers \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null | jq '.providers | length')
    
    if [ "$PROVIDERS" -gt 0 ]; then
        echo "✅ $PROVIDERS bank provider(s) active!"
        echo ""
        echo "Step 6: Test Bank Connection"
        echo "-------------------------------------------"
        echo "1. Visit: https://mymoney.mshousha.uk/settings"
        echo "2. Go to 'Bank Accounts' section"
        echo "3. Click 'Connect Bank'"
        echo "4. Select 'Plaid'"
        echo "5. Search for 'Chase' or any bank"
        echo "6. Use sandbox credentials:"
        echo "   Username: user_good"
        echo "   Password: pass_good"
        echo "   Phone: 1234567890"
        echo "   OTP: 123456"
    else
        echo "⚠️  Configuration saved but provider not detected."
        echo "Check logs: journalctl -u mymoney-api -f"
    fi
else
    echo "❌ Missing credentials. Please try again."
fi

echo ""
echo "=========================================="
echo "  Plaid Sandbox Test Credentials"
echo "=========================================="
echo "Username: user_good"
echo "Password: pass_good"
echo "Phone:    1234567890"
echo "OTP:      123456"
echo ""
echo "Available Test Banks:"
echo "- Chase"
echo "- Bank of America"
echo "- Wells Fargo"
echo "- Citibank"
echo "- US Bank"
echo "- And 12,000+ more..."
echo ""

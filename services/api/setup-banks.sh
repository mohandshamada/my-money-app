#!/bin/bash
# Bank Integration Sandbox Setup Script

echo "=========================================="
echo "  My Money - Bank Integration Setup"
echo "=========================================="
echo ""

ENV_FILE="/root/cashflow/services/api/.env"

echo "This script will help you set up sandbox credentials for testing."
echo ""

# Check if already configured
if grep -q "PLAID_CLIENT_ID=your_plaid_client_id_here" "$ENV_FILE"; then
    echo "❌ Plaid not configured yet"
    echo ""
    echo "To get FREE Plaid sandbox credentials:"
    echo "1. Go to https://dashboard.plaid.com/signup"
    echo "2. Create a free account (no credit card required)"
    echo "3. Get your Client ID and Secret from the dashboard"
    echo ""
    read -p "Enter your Plaid Client ID: " PLAID_CLIENT_ID
    read -p "Enter your Plaid Secret: " PLAID_SECRET
    
    if [ -n "$PLAID_CLIENT_ID" ] && [ -n "$PLAID_SECRET" ]; then
        sed -i "s/your_plaid_client_id_here/$PLAID_CLIENT_ID/g" "$ENV_FILE"
        sed -i "s/your_plaid_secret_here/$PLAID_SECRET/g" "$ENV_FILE"
        echo "✅ Plaid configured!"
    fi
else
    echo "✅ Plaid already configured"
fi

echo ""

if grep -q "TRUELAYER_CLIENT_ID=your_truelayer_client_id_here" "$ENV_FILE"; then
    echo "❌ TrueLayer not configured yet (optional)"
    echo ""
    echo "To get FREE TrueLayer sandbox credentials:"
    echo "1. Go to https://console.truelayer.com"
    echo "2. Sign up for a free account"
    echo "3. Create an app to get Client ID and Secret"
    echo ""
    read -p "Enter your TrueLayer Client ID (or press Enter to skip): " TL_CLIENT_ID
    
    if [ -n "$TL_CLIENT_ID" ]; then
        read -p "Enter your TrueLayer Client Secret: " TL_SECRET
        sed -i "s/your_truelayer_client_id_here/$TL_CLIENT_ID/g" "$ENV_FILE"
        sed -i "s/your_truelayer_secret_here/$TL_SECRET/g" "$ENV_FILE"
        echo "✅ TrueLayer configured!"
    else
        echo "⏭️  Skipping TrueLayer setup"
    fi
else
    echo "✅ TrueLayer already configured"
fi

echo ""
echo "=========================================="
echo "  Testing Configuration"
echo "=========================================="
echo ""

# Restart API
systemctl restart mymoney-api
sleep 3

# Test providers
RESPONSE=$(curl -s http://localhost:5000/api/bank/providers)
PROVIDER_COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l)

echo "Available providers: $PROVIDER_COUNT"
echo ""

if [ "$PROVIDER_COUNT" -gt 0 ]; then
    echo "✅ Bank integration is ready!"
    echo ""
    echo "Test Credentials for Plaid Sandbox:"
    echo "  Username: user_good"
    echo "  Password: pass_good"
    echo "  Phone:    1234567890"
    echo "  OTP:      123456"
    echo ""
    echo "Go to https://mymoney.mshousha.uk/settings to test!"
else
    echo "⚠️  No providers configured yet."
    echo "Please add your API keys to continue."
fi

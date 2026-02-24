#!/bin/bash
# Test Bank Integration Script

API_URL="http://localhost:5000"

echo "=========================================="
echo "  Testing Bank Integration"
echo "=========================================="
echo ""

# Get auth token
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass123!"}' | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Check providers
echo "Available Bank Providers:"
curl -s "$API_URL/api/bank/providers" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.providers[] | "  ✅ \(.name) - Regions: \(.regions | join(", "))"'

PROVIDER_COUNT=$(curl -s "$API_URL/api/bank/providers" \
  -H "Authorization: Bearer $TOKEN" | jq '.providers | length')

echo ""
echo "Total providers: $PROVIDER_COUNT"
echo ""

if [ "$PROVIDER_COUNT" -eq 0 ]; then
    echo "⚠️  No providers configured!"
    echo ""
    echo "To set up:"
    echo "1. Get free sandbox keys at https://dashboard.plaid.com/signup"
    echo "2. Edit: nano /root/cashflow/services/api/.env"
    echo "3. Add: PLAID_CLIENT_ID=your_id"
    echo "4. Add: PLAID_SECRET=your_secret"
    echo "5. Restart: systemctl restart mymoney-api"
    exit 1
fi

echo "✅ Bank integration is ready to use!"
echo ""
echo "Next steps:"
echo "1. Visit: https://mymoney.mshousha.uk/settings"
echo "2. Go to 'Bank Accounts' section"
echo "3. Click 'Connect Bank'"
echo "4. Use sandbox credentials:"
echo "   Username: user_good"
echo "   Password: pass_good"
echo "   Phone:    1234567890"
echo "   OTP:      123456"

#!/bin/bash
# Daily exchange rate refresh - runs at 6 AM UTC
cd /root/cashflow/services/api

# Clear cache to force fresh fetch on next request
psql -U postgres -d mymoney -c "DELETE FROM exchange_rates;" 2>/dev/null

echo "$(date): Exchange rates cache cleared, will refresh on next API call"

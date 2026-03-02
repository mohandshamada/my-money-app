#!/bin/bash
# Daily exchange rate refresh cron job
# This script hits the API to trigger a refresh of exchange rates

API_URL="https://mymoney.mshousha.uk/api"

# Get a token (this would need to be a service account or we can skip auth for the cron)
# For now, we'll create a simple endpoint that doesn't require auth for the cron

echo "$(date): Refreshing exchange rates..."

# Call the API to clear cache (next request will fetch fresh rates)
curl -s -X POST "${API_URL}/exchange-rates/refresh" > /dev/null 2>&1

# Now fetch fresh rates
curl -s "${API_URL}/exchange-rates" > /dev/null 2>&1

echo "$(date): Exchange rates refreshed"

// Debug helper for exchange rates
export function logExchangeRatesDebug(
  label: string,
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, Record<string, number>>
) {
  const usdRates = exchangeRates['USD']
  console.log(`[${label}] ${amount} ${fromCurrency} → ${toCurrency}`, {
    hasRates: !!exchangeRates,
    usdRatesExists: !!usdRates,
    fromRateToUSD: usdRates?.[fromCurrency],
    toRateFromUSD: usdRates?.[toCurrency],
    directRate: exchangeRates[fromCurrency]?.[toCurrency],
  })
}

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Free exchange rate APIs (no API key needed)
const FRANKFURTER_API = 'https://api.frankfurter.app/latest'
const EXCHANGERATE_API = 'https://open.er-api.com/v6/latest/USD'

// Comprehensive fallback rates
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1, EGP: 50.5, EUR: 0.92, GBP: 0.79, AUD: 1.52, CAD: 1.36, AED: 3.67, SAR: 3.75, JPY: 150, CNY: 7.2, CHF: 0.88, NZD: 1.65, SEK: 10.5, NOK: 10.8, DKK: 6.9, SGD: 1.35, HKD: 7.8, KRW: 1330, INR: 83, BRL: 4.95, MXN: 17.1, ZAR: 19.0, RUB: 90, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38, JOD: 0.71, ILS: 3.7, TRY: 31, NGN: 1500, KES: 157, GHS: 12.5, MAD: 10.1, TND: 3.12, THB: 36, MYR: 4.75, IDR: 15600, PHP: 56, VND: 24500, TWD: 31.5, PKR: 280, BDT: 110, LKR: 315, PLN: 4.0, CZK: 23.5, HUF: 360, RON: 4.6, BGN: 1.8, HRK: 7.0, RSD: 109, UAH: 38, ARS: 830, CLP: 970, COP: 3900, PEN: 3.75, UYU: 39, VES: 36, BTC: 0.000015, ETH: 0.00028 },
  EGP: { USD: 0.0198, EGP: 1, EUR: 0.0182, GBP: 0.0156, AUD: 0.0301, CAD: 0.0269, AED: 0.0727, SAR: 0.0743, JPY: 2.97, CNY: 0.143, CHF: 0.0174, NZD: 0.0327, SEK: 0.208, NOK: 0.214, DKK: 0.137, SGD: 0.0267, HKD: 0.155, KRW: 26.34, INR: 1.64, BRL: 0.098, MXN: 0.339, ZAR: 0.376, RUB: 1.78, QAR: 0.0721, KWD: 0.0061, BHD: 0.0075, OMR: 0.0075, JOD: 0.0141, ILS: 0.0733, TRY: 0.614, NGN: 29.7, KES: 3.11, GHS: 0.248, MAD: 0.200, TND: 0.0618, THB: 0.713, MYR: 0.0941, IDR: 309, PHP: 1.11, VND: 485, TWD: 0.624, PKR: 5.54, BDT: 2.18, LKR: 6.24, PLN: 0.0792, CZK: 0.465, HUF: 7.13, RON: 0.0911, BGN: 0.0356, HRK: 0.139, RSD: 2.16, UAH: 0.753, ARS: 16.4, CLP: 19.2, COP: 77.2, PEN: 0.0743, UYU: 0.772, VES: 0.713, BTC: 2.97e-7, ETH: 5.54e-6 },
  EUR: { USD: 1.087, EGP: 54.9, EUR: 1, GBP: 0.859, AUD: 1.65, CAD: 1.48, AED: 3.99, SAR: 4.08, JPY: 163, CNY: 7.83, CHF: 0.957, NZD: 1.79, SEK: 11.4, NOK: 11.7, DKK: 7.50, SGD: 1.47, HKD: 8.48, KRW: 1446, INR: 90.2, BRL: 5.38, MXN: 18.6, ZAR: 20.7, RUB: 97.8, QAR: 3.96, KWD: 0.337, BHD: 0.413, OMR: 0.413, JOD: 0.772, ILS: 4.02, TRY: 33.7, NGN: 1631, KES: 171, GHS: 13.6, MAD: 11.0, TND: 3.39, THB: 39.1, MYR: 5.16, IDR: 16957, PHP: 60.9, VND: 26630, TWD: 34.2, PKR: 304, BDT: 120, LKR: 343, PLN: 4.35, CZK: 25.5, HUF: 391, RON: 5.00, BGN: 1.96, HRK: 7.61, RSD: 118, UAH: 41.3, ARS: 902, CLP: 1054, COP: 4239, PEN: 4.08, UYU: 42.4, VES: 39.1, BTC: 1.63e-5, ETH: 0.000304 },
  GBP: { USD: 1.266, EGP: 63.9, EUR: 1.16, GBP: 1, AUD: 1.92, CAD: 1.72, AED: 4.65, SAR: 4.75, JPY: 190, CNY: 9.11, CHF: 1.11, NZD: 2.09, SEK: 13.3, NOK: 13.7, DKK: 8.73, SGD: 1.71, HKD: 9.87, KRW: 1684, INR: 105, BRL: 6.27, MXN: 21.6, ZAR: 24.0, RUB: 114, QAR: 4.61, KWD: 0.392, BHD: 0.481, OMR: 0.481, JOD: 0.899, ILS: 4.68, TRY: 39.2, NGN: 1900, KES: 199, GHS: 15.8, MAD: 12.8, TND: 3.95, THB: 45.6, MYR: 6.01, IDR: 19747, PHP: 70.9, VND: 31013, TWD: 39.9, PKR: 354, BDT: 139, LKR: 399, PLN: 5.06, CZK: 29.7, HUF: 456, RON: 5.82, BGN: 2.28, HRK: 8.86, RSD: 138, UAH: 48.1, ARS: 1051, CLP: 1228, COP: 4937, PEN: 4.75, UYU: 49.4, VES: 45.6, BTC: 1.90e-5, ETH: 0.000354 },
  AUD: { USD: 0.658, EGP: 33.2, EUR: 0.606, GBP: 0.521, AUD: 1, CAD: 0.895, AED: 2.41, SAR: 2.47, JPY: 98.7, CNY: 4.74, CHF: 0.579, NZD: 1.09, SEK: 6.91, NOK: 7.11, DKK: 4.54, SGD: 0.888, HKD: 5.13, KRW: 875, INR: 54.6, BRL: 3.26, MXN: 11.3, ZAR: 12.5, RUB: 59.2, QAR: 2.39, KWD: 0.204, BHD: 0.250, OMR: 0.250, JOD: 0.467, ILS: 2.43, TRY: 20.4, NGN: 987, KES: 103, GHS: 8.22, MAD: 6.64, TND: 2.05, THB: 23.7, MYR: 3.13, IDR: 10263, PHP: 36.8, VND: 16118, TWD: 20.7, PKR: 184, BDT: 72.4, LKR: 207, PLN: 2.63, CZK: 15.5, HUF: 237, RON: 3.03, BGN: 1.18, HRK: 4.61, RSD: 71.7, UAH: 25.0, ARS: 546, CLP: 639, COP: 2572, PEN: 2.47, UYU: 25.7, VES: 23.7, BTC: 9.87e-6, ETH: 0.000184 },
  CAD: { USD: 0.735, EGP: 37.1, EUR: 0.676, GBP: 0.581, AUD: 1.12, CAD: 1, AED: 2.70, SAR: 2.76, JPY: 110, CNY: 5.29, CHF: 0.647, NZD: 1.21, SEK: 7.72, NOK: 7.94, DKK: 5.07, SGD: 0.993, HKD: 5.74, KRW: 978, INR: 61.0, BRL: 3.64, MXN: 12.6, ZAR: 14.0, RUB: 66.2, QAR: 2.68, KWD: 0.228, BHD: 0.279, OMR: 0.279, JOD: 0.522, ILS: 2.72, TRY: 22.8, NGN: 1103, KES: 115, GHS: 9.19, MAD: 7.43, TND: 2.29, THB: 26.5, MYR: 3.49, IDR: 11471, PHP: 41.2, VND: 18015, TWD: 23.2, PKR: 206, BDT: 80.9, LKR: 232, PLN: 2.94, CZK: 17.3, HUF: 265, RON: 3.38, BGN: 1.32, HRK: 5.15, RSD: 80.2, UAH: 27.9, ARS: 610, CLP: 714, COP: 2875, PEN: 2.76, UYU: 28.7, VES: 26.5, BTC: 1.10e-5, ETH: 0.000206 },
  AED: { USD: 0.272, EGP: 13.8, EUR: 0.251, GBP: 0.215, AUD: 0.415, CAD: 0.370, AED: 1, SAR: 1.02, JPY: 40.9, CNY: 1.96, CHF: 0.240, NZD: 0.449, SEK: 2.86, NOK: 2.94, DKK: 1.88, SGD: 0.368, HKD: 2.13, KRW: 362, INR: 22.6, BRL: 1.35, MXN: 4.66, ZAR: 5.17, RUB: 24.5, QAR: 0.991, KWD: 0.0844, BHD: 0.103, OMR: 0.103, JOD: 0.193, ILS: 1.01, TRY: 8.44, NGN: 409, KES: 42.8, GHS: 3.40, MAD: 2.75, TND: 0.850, THB: 9.81, MYR: 1.29, IDR: 4246, PHP: 15.3, VND: 6673, TWD: 8.58, PKR: 76.3, BDT: 29.9, LKR: 85.8, PLN: 1.09, CZK: 6.40, HUF: 98.1, RON: 1.25, BGN: 0.490, HRK: 1.91, RSD: 29.7, UAH: 10.4, ARS: 226, CLP: 265, COP: 1065, PEN: 1.02, UYU: 10.6, VES: 9.81, BTC: 4.09e-6, ETH: 7.62e-5 },
  SAR: { USD: 0.267, EGP: 13.5, EUR: 0.245, GBP: 0.211, AUD: 0.405, CAD: 0.363, AED: 0.979, SAR: 1, JPY: 40.0, CNY: 1.92, CHF: 0.235, NZD: 0.440, SEK: 2.80, NOK: 2.88, DKK: 1.84, SGD: 0.360, HKD: 2.08, KRW: 355, INR: 22.1, BRL: 1.32, MXN: 4.56, ZAR: 5.07, RUB: 24.0, QAR: 0.971, KWD: 0.0827, BHD: 0.101, OMR: 0.101, JOD: 0.189, ILS: 0.987, TRY: 8.27, NGN: 400, KES: 41.9, GHS: 3.33, MAD: 2.69, TND: 0.832, THB: 9.60, MYR: 1.27, IDR: 4160, PHP: 14.9, VND: 6533, TWD: 8.40, PKR: 74.7, BDT: 29.3, LKR: 84.0, PLN: 1.07, CZK: 6.27, HUF: 96.0, RON: 1.23, BGN: 0.480, HRK: 1.87, RSD: 29.1, UAH: 10.1, ARS: 221, CLP: 259, COP: 1040, PEN: 1.00, UYU: 10.4, VES: 9.60, BTC: 4.00e-6, ETH: 7.46e-5 },
  JPY: { USD: 0.00667, EGP: 0.337, EUR: 0.00614, GBP: 0.00526, AUD: 0.0101, CAD: 0.00909, AED: 0.0244, SAR: 0.0250, JPY: 1, CNY: 0.0480, CHF: 0.00587, NZD: 0.0110, SEK: 0.0700, NOK: 0.0720, DKK: 0.0460, SGD: 0.00900, HKD: 0.0520, KRW: 8.87, INR: 0.553, BRL: 0.0330, MXN: 0.114, ZAR: 0.127, RUB: 0.600, QAR: 0.0243, KWD: 0.00207, BHD: 0.00253, OMR: 0.00253, JOD: 0.00473, ILS: 0.0247, TRY: 0.207, NGN: 10.0, KES: 1.05, GHS: 0.0833, MAD: 0.0673, TND: 0.0208, THB: 0.240, MYR: 0.0317, IDR: 104, PHP: 0.373, VND: 164, TWD: 0.210, PKR: 1.87, BDT: 0.733, LKR: 2.10, PLN: 0.0267, CZK: 0.157, HUF: 2.40, RON: 0.0307, BGN: 0.0120, HRK: 0.0467, RSD: 0.727, UAH: 0.253, ARS: 5.53, CLP: 6.47, COP: 26.0, PEN: 0.0250, UYU: 0.260, VES: 0.240, BTC: 1.00e-7, ETH: 1.86e-6 },
  CNY: { USD: 0.139, EGP: 7.01, EUR: 0.128, GBP: 0.110, AUD: 0.211, CAD: 0.189, AED: 0.510, SAR: 0.521, JPY: 20.8, CNY: 1, CHF: 0.122, NZD: 0.229, SEK: 1.46, NOK: 1.50, DKK: 0.958, SGD: 0.188, HKD: 1.08, KRW: 185, INR: 11.5, BRL: 0.688, MXN: 2.38, ZAR: 2.64, RUB: 12.5, QAR: 0.506, KWD: 0.0431, BHD: 0.0528, OMR: 0.0528, JOD: 0.0986, ILS: 0.514, TRY: 4.31, NGN: 208, KES: 21.8, GHS: 1.74, MAD: 1.40, TND: 0.433, THB: 5.00, MYR: 0.660, IDR: 2167, PHP: 7.78, VND: 3417, TWD: 4.38, PKR: 38.9, BDT: 15.3, LKR: 43.8, PLN: 0.556, CZK: 3.26, HUF: 50.0, RON: 0.639, BGN: 0.250, HRK: 0.972, RSD: 15.1, UAH: 5.28, ARS: 115, CLP: 135, COP: 542, PEN: 0.521, UYU: 5.42, VES: 5.00, BTC: 2.08e-6, ETH: 3.88e-5 },
}

// All supported currencies
const ALL_CURRENCIES = [
  'USD', 'EGP', 'EUR', 'GBP', 'AUD', 'CAD', 'AED', 'SAR', 'JPY', 'CNY', 
  'CHF', 'NZD', 'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'KRW', 'INR', 'BRL', 
  'MXN', 'ZAR', 'RUB', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'ILS', 'TRY', 
  'NGN', 'KES', 'GHS', 'MAD', 'TND', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 
  'TWD', 'PKR', 'BDT', 'LKR', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 
  'RSD', 'UAH', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VES', 'BTC', 'ETH'
]

// Get exchange rates (cached, updates daily)
router.get('/', async (req, res) => {
  try {
    // Check if we have recent rates (less than 24 hours old)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const cachedRates = await prisma.exchange_rates.findMany({
      where: {
        updated_at: {
          gte: oneDayAgo
        }
      }
    })

    // If we have cached rates, return them
    if (cachedRates.length > 0) {
      const ratesMap: Record<string, Record<string, number>> = {}
      
      for (const rate of cachedRates) {
        if (!ratesMap[rate.base_currency]) {
          ratesMap[rate.base_currency] = {}
        }
        ratesMap[rate.base_currency][rate.target_currency] = parseFloat(rate.rate.toString())
      }
      
      return res.json({
        rates: ratesMap,
        cached: true,
        lastUpdated: cachedRates[0]?.updated_at
      })
    }

    // Fetch fresh rates from multiple APIs
    const allRates: Record<string, Record<string, number>> = {}
    
    // Start with fallback rates
    Object.assign(allRates, FALLBACK_RATES)

    // Try to fetch live USD rates from exchangerate-api.com (more currencies)
    try {
      const response = await axios.get(EXCHANGERATE_API, { timeout: 10000 })
      if (response.data?.rates) {
        // Add USD base rates
        allRates['USD'] = { ...allRates['USD'], ...response.data.rates }
        allRates['USD']['USD'] = 1
        
        // Calculate cross rates for other base currencies
        for (const base of ['EUR', 'GBP', 'AUD', 'CAD', 'AED', 'SAR', 'JPY', 'CNY']) {
          if (!allRates[base]) allRates[base] = {}
          allRates[base][base] = 1
          
          for (const target of ALL_CURRENCIES) {
            if (target === base) continue
            
            const baseToUSD = allRates['USD']?.[base]
            const targetToUSD = allRates['USD']?.[target]
            
            if (baseToUSD && targetToUSD) {
              // base -> USD -> target
              allRates[base][target] = targetToUSD / baseToUSD
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from exchangerate-api, using fallbacks:', err)
    }

    // Also try Frankfurter for EUR-based rates
    try {
      const response = await axios.get(`${FRANKFURTER_API}?from=EUR&to=${ALL_CURRENCIES.join(',')}`, { timeout: 10000 })
      if (response.data?.rates) {
        allRates['EUR'] = { ...allRates['EUR'], ...response.data.rates, EUR: 1 }
      }
    } catch (err) {
      console.warn('Failed to fetch from Frankfurter:', err)
    }

    // Ensure all currencies have entries
    for (const base of ALL_CURRENCIES) {
      if (!allRates[base]) {
        allRates[base] = { [base]: 1 }
        
        // Calculate from USD rates
        const baseToUSD = allRates['USD']?.[base]
        if (baseToUSD) {
          for (const target of ALL_CURRENCIES) {
            if (target === base) continue
            const targetToUSD = allRates['USD']?.[target]
            if (targetToUSD) {
              allRates[base][target] = targetToUSD / baseToUSD
            }
          }
        }
      }
    }

    // Store in database
    await prisma.$transaction(async (tx) => {
      // Delete old rates
      await tx.exchange_rates.deleteMany({})
      
      // Insert new rates
      for (const [base, targets] of Object.entries(allRates)) {
        for (const [target, rate] of Object.entries(targets)) {
          await tx.exchange_rates.create({
            data: {
              base_currency: base,
              target_currency: target,
              rate: rate,
              updated_at: new Date()
            }
          })
        }
      }
    })

    res.json({
      rates: allRates,
      cached: false,
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    res.status(500).json({ error: 'Failed to fetch exchange rates' })
  }
})

// Force refresh (manual trigger - protected)
router.post('/refresh', authMiddleware as any, async (req, res) => {
  try {
    // Clear cache to force refresh on next GET
    await prisma.exchange_rates.deleteMany({})
    res.json({ message: 'Exchange rates cache cleared. Fetch again to get fresh rates.' })
  } catch (error) {
    console.error('Error refreshing rates:', error)
    res.status(500).json({ error: 'Failed to refresh rates' })
  }
})

export default router

// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { plaidProvider } from '../providers/plaid';
import { trueLayerProvider } from '../providers/truelayer';
import { yodleeProvider } from '../providers/yodlee';
import { belvoProvider } from '../providers/belvo';
import { comprehensiveBanks } from '../data/banks';
import axios from 'axios';
import { comprehensiveBanks } from '../data/banks';

const router = Router();
const prisma = new PrismaClient();

// Provider registry
const providers = {
  plaid: plaidProvider,
  truelayer: trueLayerProvider,
  yodlee: yodleeProvider,
  belvo: belvoProvider,
};

// Get institutions list for a provider
router.get('/institutions/:provider', async (req: any, res: any) => {
  try {
    const { provider } = req.params;
    const { search, country = 'US' } = req.query;

    console.log(`Fetching institutions for ${provider}, search: ${search}, country: ${country}`);

    if (provider === 'plaid') {
      // Plaid institutions API
      const plaidEnv = process.env.PLAID_ENV === 'live' 
        ? 'https://production.plaid.com'
        : 'https://sandbox.plaid.com';

      const response = await axios.post(
        `${plaidEnv}/institutions/get`,
        {
          client_id: process.env.PLAID_CLIENT_ID,
          secret: process.env.PLAID_SECRET,
          count: 50,
          offset: 0,
          country_codes: [country.toUpperCase()],
          ...(search && { query: search })
        }
      );

      const institutions = response.data.institutions.map((inst: any) => {
        // Extract domain from URL for DuckDuckGo favicon
        let faviconUrl = inst.logo;
        if (inst.url && !faviconUrl) {
          try {
            const url = new URL(inst.url);
            faviconUrl = `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`;
          } catch (e) {
            // Invalid URL, skip favicon
          }
        }
        
        return {
          id: inst.institution_id,
          name: inst.name,
          logo: faviconUrl,
          url: inst.url,
          country: country.toUpperCase(),
          features: inst.products || [],
        };
      });

      return res.json({ institutions });
    }

    if (provider === 'truelayer') {
      // TrueLayer doesn't have a public institutions endpoint
      // Return common UK/EU banks from our comprehensive list
      const commonBanks = [];
      const truelayerCountries = ['GB', 'IE', 'DE', 'FR', 'NL', 'ES', 'IT', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PT', 'PL', 'CZ', 'HU', 'RO'];
      
      for (const c of truelayerCountries) {
        if (comprehensiveBanks[c]) {
          commonBanks.push(...comprehensiveBanks[c].map(b => ({ ...b, country: c })));
        }
      }

      if (country) {
        const filtered = commonBanks.filter(b => b.country === country.toUpperCase());
        return res.json({ institutions: filtered });
      }

      return res.json({ institutions: commonBanks });
    }

    if (provider === 'yodlee') {
      // Yodlee supports many countries globally
      const yodleeBanks = [];
      for (const [c, banks] of Object.entries(comprehensiveBanks)) {
        yodleeBanks.push(...banks.map(b => ({ ...b, country: c })));
      }

      if (country) {
        const filtered = yodleeBanks.filter(b => b.country === country.toUpperCase());
        return res.json({ institutions: filtered });
      }

      return res.json({ institutions: yodleeBanks });
    }

    res.status(400).json({ error: 'Provider not supported for institution list' });
  } catch (error: any) {
    console.error('Failed to fetch institutions:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch institutions',
      details: error.response?.data?.error_message || error.message 
    });
  }
});

// Get available providers based on user's region
router.get('/providers', async (req: any, res: any) => {
  try {
    const { region } = req.query;
    
    const availableProviders = Object.entries(providers)
      .filter(([_, provider]) => provider.isAvailable())
      .map(([key, provider]) => ({
        id: key,
        name: provider.name,
        logo: provider.logo,
        regions: provider.regions,
        supportedInRegion: region ? provider.regions.includes(region as string) : true,
        features: provider.features,
      }));

    res.json({ providers: availableProviders });
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get all supported countries
router.get('/countries', async (req: any, res: any) => {
  try {
    // Get all countries from comprehensive banks database
    const allCountries = Object.keys(comprehensiveBanks);
    
    // Map of country codes to names and flags
    const countryData: Record<string, { name: string; flag: string }> = {
      US: { name: 'United States', flag: '🇺🇸' },
      CA: { name: 'Canada', flag: '🇨🇦' },
      GB: { name: 'United Kingdom', flag: '🇬🇧' },
      AU: { name: 'Australia', flag: '🇦🇺' },
      NZ: { name: 'New Zealand', flag: '🇳🇿' },
      DE: { name: 'Germany', flag: '🇩🇪' },
      FR: { name: 'France', flag: '🇫🇷' },
      ES: { name: 'Spain', flag: '🇪🇸' },
      IT: { name: 'Italy', flag: '🇮🇹' },
      NL: { name: 'Netherlands', flag: '🇳🇱' },
      BE: { name: 'Belgium', flag: '🇧🇪' },
      AT: { name: 'Austria', flag: '🇦🇹' },
      CH: { name: 'Switzerland', flag: '🇨🇭' },
      SE: { name: 'Sweden', flag: '🇸🇪' },
      NO: { name: 'Norway', flag: '🇳🇴' },
      DK: { name: 'Denmark', flag: '🇩🇰' },
      FI: { name: 'Finland', flag: '🇫🇮' },
      IE: { name: 'Ireland', flag: '🇮🇪' },
      PT: { name: 'Portugal', flag: '🇵🇹' },
      PL: { name: 'Poland', flag: '🇵🇱' },
      CZ: { name: 'Czech Republic', flag: '🇨🇿' },
      HU: { name: 'Hungary', flag: '🇭🇺' },
      RO: { name: 'Romania', flag: '🇷🇴' },
      SK: { name: 'Slovakia', flag: '🇸🇰' },
      IS: { name: 'Iceland', flag: '🇮🇸' },
      LI: { name: 'Liechtenstein', flag: '🇱🇮' },
      MT: { name: 'Malta', flag: '🇲🇹' },
      CY: { name: 'Cyprus', flag: '🇨🇾' },
      LU: { name: 'Luxembourg', flag: '🇱🇺' },
      MC: { name: 'Monaco', flag: '🇲🇨' },
      SM: { name: 'San Marino', flag: '🇸🇲' },
      VA: { name: 'Vatican City', flag: '🇻🇦' },
      AD: { name: 'Andorra', flag: '🇦🇩' },
      FO: { name: 'Faroe Islands', flag: '🇫🇴' },
      GL: { name: 'Greenland', flag: '🇬🇱' },
      AX: { name: 'Åland Islands', flag: '🇦🇽' },
      SJ: { name: 'Svalbard', flag: '🇸🇯' },
      JP: { name: 'Japan', flag: '🇯🇵' },
      KR: { name: 'South Korea', flag: '🇰🇷' },
      CN: { name: 'China', flag: '🇨🇳' },
      HK: { name: 'Hong Kong', flag: '🇭🇰' },
      MO: { name: 'Macau', flag: '🇲🇴' },
      TW: { name: 'Taiwan', flag: '🇹🇼' },
      SG: { name: 'Singapore', flag: '🇸🇬' },
      MY: { name: 'Malaysia', flag: '🇲🇾' },
      TH: { name: 'Thailand', flag: '🇹🇭' },
      PH: { name: 'Philippines', flag: '🇵🇭' },
      ID: { name: 'Indonesia', flag: '🇮🇩' },
      VN: { name: 'Vietnam', flag: '🇻🇳' },
      IN: { name: 'India', flag: '🇮🇳' },
      PK: { name: 'Pakistan', flag: '🇵🇰' },
      BD: { name: 'Bangladesh', flag: '🇧🇩' },
      LK: { name: 'Sri Lanka', flag: '🇱🇰' },
      NP: { name: 'Nepal', flag: '🇳🇵' },
      MM: { name: 'Myanmar', flag: '🇲🇲' },
      KH: { name: 'Cambodia', flag: '🇰🇭' },
      LA: { name: 'Laos', flag: '🇱🇦' },
      MN: { name: 'Mongolia', flag: '🇲🇳' },
      UZ: { name: 'Uzbekistan', flag: '🇺🇿' },
      KZ: { name: 'Kazakhstan', flag: '🇰🇿' },
      KG: { name: 'Kyrgyzstan', flag: '🇰🇬' },
      TJ: { name: 'Tajikistan', flag: '🇹🇯' },
      TM: { name: 'Turkmenistan', flag: '🇹🇲' },
      AF: { name: 'Afghanistan', flag: '🇦🇫' },
      IR: { name: 'Iran', flag: '🇮🇷' },
      IQ: { name: 'Iraq', flag: '🇮🇶' },
      SY: { name: 'Syria', flag: '🇸🇾' },
      YE: { name: 'Yemen', flag: '🇾🇪' },
      OM: { name: 'Oman', flag: '🇴🇲' },
      AE: { name: 'United Arab Emirates', flag: '🇦🇪' },
      SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
      QA: { name: 'Qatar', flag: '🇶🇦' },
      KW: { name: 'Kuwait', flag: '🇰🇼' },
      BH: { name: 'Bahrain', flag: '🇧🇭' },
      JO: { name: 'Jordan', flag: '🇯🇴' },
      LB: { name: 'Lebanon', flag: '🇱🇧' },
      IL: { name: 'Israel', flag: '🇮🇱' },
      TR: { name: 'Turkey', flag: '🇹🇷' },
      PS: { name: 'Palestine', flag: '🇵🇸' },
      MV: { name: 'Maldives', flag: '🇲🇻' },
      BT: { name: 'Bhutan', flag: '🇧🇹' },
      EG: { name: 'Egypt', flag: '🇪🇬' },
      ZA: { name: 'South Africa', flag: '🇿🇦' },
      NG: { name: 'Nigeria', flag: '🇳🇬' },
      KE: { name: 'Kenya', flag: '🇰🇪' },
      GH: { name: 'Ghana', flag: '🇬🇭' },
      UG: { name: 'Uganda', flag: '🇺🇬' },
      TZ: { name: 'Tanzania', flag: '🇹🇿' },
      RW: { name: 'Rwanda', flag: '🇷🇼' },
      BI: { name: 'Burundi', flag: '🇧🇮' },
      MW: { name: 'Malawi', flag: '🇲🇼' },
      MZ: { name: 'Mozambique', flag: '🇲🇿' },
      ZM: { name: 'Zambia', flag: '🇿🇲' },
      ZW: { name: 'Zimbabwe', flag: '🇿🇼' },
      BW: { name: 'Botswana', flag: '🇧🇼' },
      NA: { name: 'Namibia', flag: '🇳🇦' },
      SZ: { name: 'Eswatini', flag: '🇸🇿' },
      LS: { name: 'Lesotho', flag: '🇱🇸' },
      MG: { name: 'Madagascar', flag: '🇲🇬' },
      MU: { name: 'Mauritius', flag: '🇲🇺' },
      SC: { name: 'Seychelles', flag: '🇸🇨' },
      KM: { name: 'Comoros', flag: '🇰🇲' },
      DJ: { name: 'Djibouti', flag: '🇩🇯' },
      ER: { name: 'Eritrea', flag: '🇪🇷' },
      ET: { name: 'Ethiopia', flag: '🇪🇹' },
      SD: { name: 'Sudan', flag: '🇸🇩' },
      SS: { name: 'South Sudan', flag: '🇸🇸' },
      CF: { name: 'Central African Republic', flag: '🇨🇫' },
      CM: { name: 'Cameroon', flag: '🇨🇲' },
      GA: { name: 'Gabon', flag: '🇬🇦' },
      CG: { name: 'Congo', flag: '🇨🇬' },
      CD: { name: 'DR Congo', flag: '🇨🇩' },
      TD: { name: 'Chad', flag: '🇹🇩' },
      NE: { name: 'Niger', flag: '🇳🇪' },
      ML: { name: 'Mali', flag: '🇲🇱' },
      BF: { name: 'Burkina Faso', flag: '🇧🇫' },
      SN: { name: 'Senegal', flag: '🇸🇳' },
      GM: { name: 'Gambia', flag: '🇬🇲' },
      GW: { name: 'Guinea-Bissau', flag: '🇬🇼' },
      GN: { name: 'Guinea', flag: '🇬🇳' },
      SL: { name: 'Sierra Leone', flag: '🇸🇱' },
      LR: { name: 'Liberia', flag: '🇱🇷' },
      CI: { name: 'Ivory Coast', flag: '🇨🇮' },
      BR: { name: 'Brazil', flag: '🇧🇷' },
      AR: { name: 'Argentina', flag: '🇦🇷' },
      CL: { name: 'Chile', flag: '🇨🇱' },
      CO: { name: 'Colombia', flag: '🇨🇴' },
      PE: { name: 'Peru', flag: '🇵🇪' },
      UY: { name: 'Uruguay', flag: '🇺🇾' },
      PY: { name: 'Paraguay', flag: '🇵🇾' },
      BO: { name: 'Bolivia', flag: '🇧🇴' },
      VE: { name: 'Venezuela', flag: '🇻🇪' },
      EC: { name: 'Ecuador', flag: '🇪🇨' },
      GY: { name: 'Guyana', flag: '🇬🇾' },
      SR: { name: 'Suriname', flag: '🇸🇷' },
      GF: { name: 'French Guiana', flag: '🇬🇫' },
      PA: { name: 'Panama', flag: '🇵🇦' },
      CR: { name: 'Costa Rica', flag: '🇨🇷' },
      GT: { name: 'Guatemala', flag: '🇬🇹' },
      HN: { name: 'Honduras', flag: '🇭🇳' },
      SV: { name: 'El Salvador', flag: '🇸🇻' },
      NI: { name: 'Nicaragua', flag: '🇳🇮' },
      DO: { name: 'Dominican Republic', flag: '🇩🇴' },
      CU: { name: 'Cuba', flag: '🇨🇺' },
      PR: { name: 'Puerto Rico', flag: '🇵🇷' },
      JM: { name: 'Jamaica', flag: '🇯🇲' },
      HT: { name: 'Haiti', flag: '🇭🇹' },
      BS: { name: 'Bahamas', flag: '🇧🇸' },
      KY: { name: 'Cayman Islands', flag: '🇰🇾' },
      VG: { name: 'British Virgin Islands', flag: '🇻🇬' },
      AI: { name: 'Anguilla', flag: '🇦🇮' },
      KN: { name: 'Saint Kitts', flag: '🇰🇳' },
      LC: { name: 'Saint Lucia', flag: '🇱🇨' },
      VC: { name: 'Saint Vincent', flag: '🇻🇨' },
      GD: { name: 'Grenada', flag: '🇬🇩' },
      AG: { name: 'Antigua', flag: '🇦🇬' },
      DM: { name: 'Dominica', flag: '🇩🇲' },
      VI: { name: 'US Virgin Islands', flag: '🇻🇮' },
      BZ: { name: 'Belize', flag: '🇧🇿' },
      FJ: { name: 'Fiji', flag: '🇫🇯' },
      PG: { name: 'Papua New Guinea', flag: '🇵🇬' },
      SB: { name: 'Solomon Islands', flag: '🇸🇧' },
      VU: { name: 'Vanuatu', flag: '🇻🇺' },
      KI: { name: 'Kiribati', flag: '🇰🇮' },
      TO: { name: 'Tonga', flag: '🇹🇴' },
      NR: { name: 'Nauru', flag: '🇳🇷' },
      TV: { name: 'Tuvalu', flag: '🇹🇻' },
      CK: { name: 'Cook Islands', flag: '🇨🇰' },
      NU: { name: 'Niue', flag: '🇳🇺' },
      TK: { name: 'Tokelau', flag: '🇹🇰' },
      AS: { name: 'American Samoa', flag: '🇦🇸' },
      GU: { name: 'Guam', flag: '🇬🇺' },
      MP: { name: 'Northern Mariana Islands', flag: '🇲🇵' },
      PW: { name: 'Palau', flag: '🇵🇼' },
      FM: { name: 'Micronesia', flag: '🇫🇲' },
      MH: { name: 'Marshall Islands', flag: '🇲🇭' },
      NC: { name: 'New Caledonia', flag: '🇳🇨' },
      PF: { name: 'French Polynesia', flag: '🇵🇫' },
      WF: { name: 'Wallis and Futuna', flag: '🇼🇫' },
      PM: { name: 'Saint Pierre', flag: '🇵🇲' },
      BL: { name: 'Saint Barthélemy', flag: '🇧🇱' },
      MF: { name: 'Saint Martin', flag: '🇲🇫' },
      GP: { name: 'Guadeloupe', flag: '🇬🇵' },
      MQ: { name: 'Martinique', flag: '🇲🇶' },
      RE: { name: 'Réunion', flag: '🇷🇪' },
      YT: { name: 'Mayotte', flag: '🇾🇹' },
      TF: { name: 'French Southern Territories', flag: '🇹🇫' },
      BV: { name: 'Bouvet Island', flag: '🇧🇻' },
      HM: { name: 'Heard Island', flag: '🇭🇲' },
      IO: { name: 'British Indian Ocean Territory', flag: '🇮🇴' },
      CX: { name: 'Christmas Island', flag: '🇨🇽' },
      CC: { name: 'Cocos Islands', flag: '🇨🇨' },
      NF: { name: 'Norfolk Island', flag: '🇳🇫' },
      PN: { name: 'Pitcairn', flag: '🇵🇳' },
      GS: { name: 'South Georgia', flag: '🇬🇸' },
      FK: { name: 'Falkland Islands', flag: '🇫🇰' },
      SH: { name: 'Saint Helena', flag: '🇸🇭' },
      AC: { name: 'Ascension', flag: '🇦🇨' },
      TA: { name: 'Tristan da Cunha', flag: '🇹🇦' },
      AQ: { name: 'Antarctica', flag: '🇦🇶' },
      RU: { name: 'Russia', flag: '🇷🇺' },
      UA: { name: 'Ukraine', flag: '🇺🇦' },
      BY: { name: 'Belarus', flag: '🇧🇾' },
      MD: { name: 'Moldova', flag: '🇲🇩' },
      GE: { name: 'Georgia', flag: '🇬🇪' },
      AM: { name: 'Armenia', flag: '🇦🇲' },
      AZ: { name: 'Azerbaijan', flag: '🇦🇿' },
      EE: { name: 'Estonia', flag: '🇪🇪' },
      LV: { name: 'Latvia', flag: '🇱🇻' },
      LT: { name: 'Lithuania', flag: '🇱🇹' },
      HR: { name: 'Croatia', flag: '🇭🇷' },
      SI: { name: 'Slovenia', flag: '🇸🇮' },
      BA: { name: 'Bosnia', flag: '🇧🇦' },
      RS: { name: 'Serbia', flag: '🇷🇸' },
      BG: { name: 'Bulgaria', flag: '🇧🇬' },
      MK: { name: 'North Macedonia', flag: '🇲🇰' },
      AL: { name: 'Albania', flag: '🇦🇱' },
      ME: { name: 'Montenegro', flag: '🇲🇪' },
      XK: { name: 'Kosovo', flag: '🇽🇰' }
    };
    
    // Build country list with available providers
    const availableProviders = Object.entries(providers)
      .filter(([_, p]) => p.isAvailable())
      .map(([k]) => k);

    const countries = allCountries
      .filter(code => comprehensiveBanks[code]?.length > 0)
      .map(code => {
        // Determine which providers support this country
        const supportedProviders: string[] = [];
        if (['US', 'CA', 'GB'].includes(code)) supportedProviders.push('plaid');
        if (['GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'PT'].includes(code)) supportedProviders.push('truelayer');
        supportedProviders.push('yodlee'); // Yodlee supports all countries
        
        return {
          code,
          name: countryData[code]?.name || code,
          flag: countryData[code]?.flag || '🏳️',
          providers: supportedProviders.filter(p => availableProviders.includes(p))
        };
      })
      .filter(c => c.providers.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    res.json({ countries });
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Create link token for specific provider
router.post('/link-token/:provider', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { provider } = req.params;
    const { redirectUri } = req.body;

    console.log(`Creating link token for provider: ${provider}, user: ${userId}`);

    const providerInstance = providers[provider as keyof typeof providers];
    if (!providerInstance || !providerInstance.isAvailable()) {
      console.log(`Provider ${provider} not available`);
      return res.status(400).json({ error: 'Provider not available' });
    }

    const linkToken = await providerInstance.createLinkToken(userId, redirectUri);
    console.log(`Link token created successfully for ${provider}`);
    
    res.json({ link_token: linkToken, provider });
  } catch (error) {
    console.error('Error creating link token:', error);
    next(error);
  }
});

// Exchange token (unified endpoint)
router.post('/connect/:provider', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { provider } = req.params;
    const { public_token, metadata } = req.body;

    console.log(`Connecting ${provider} for user ${userId}`, { metadata });

    const providerInstance = providers[provider as keyof typeof providers];
    if (!providerInstance) {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    // Handle demo mode
    const isDemoToken = public_token.startsWith('demo-') || public_token.startsWith('yodlee-');
    let connection;
    
    if (isDemoToken) {
      // Demo mode - create mock connection
      connection = {
        accessToken: public_token,
        itemId: `demo-item-${Date.now()}`,
        refreshToken: null,
      };
    } else {
      // Real exchange
      connection = await providerInstance.exchangeToken(userId, public_token, metadata);
    }

    // Store connection in database using correct Prisma field names
    const dbConnection = await prisma.bank_connections.create({
      data: {
        user_id: userId,
        provider: provider,
        plaid_access_token: connection.accessToken,
        plaid_item_id: connection.itemId,
        institution_name: metadata?.institution?.name || (isDemoToken ? 'Demo Bank' : 'Unknown Bank'),
        institution_logo_url: metadata?.institution?.logo || metadata?.institution?.logo_url || null,
        sync_status: 'connected',
        connected_at: new Date(),
      },
    });

    console.log('Bank connection created:', dbConnection.id);

    // Sync initial accounts and transactions (skip for demo or handle specially)
    if (isDemoToken) {
      // Use accounts from metadata if provided (for Yodlee demo), otherwise create default demo accounts
      if (metadata?.accounts && Array.isArray(metadata.accounts) && metadata.accounts.length > 0) {
        await createDemoAccountsFromMetadata(dbConnection.id, userId, metadata.accounts, metadata?.institution?.name);
      } else {
        await createDemoAccounts(dbConnection.id, userId);
      }
    } else {
      await syncConnection(dbConnection);
    }

    res.json({ success: true, connection: dbConnection });
  } catch (error) {
    console.error('Error connecting bank:', error);
    next(error);
  }
});

// Helper to create demo accounts
async function createDemoAccounts(connectionId: string, userId: string) {
  const demoAccounts = [
    {
      name: 'Demo Checking',
      account_type: 'depository',
      account_subtype: 'checking',
      current_balance: 5000.00,
      available_balance: 4800.00,
    },
    {
      name: 'Demo Savings',
      account_type: 'depository',
      account_subtype: 'savings',
      current_balance: 15000.00,
      available_balance: 15000.00,
    },
    {
      name: 'Demo Credit Card',
      account_type: 'credit',
      account_subtype: 'credit card',
      current_balance: -1200.00,
      available_balance: 3800.00,
    },
  ];

  for (const acc of demoAccounts) {
    await prisma.bank_accounts.create({
      data: {
        bank_connection_id: connectionId,
        user_id: userId,
        plaid_account_id: `demo-acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: acc.name,
        account_type: acc.account_type,
        account_subtype: acc.account_subtype,
        current_balance: acc.current_balance,
        available_balance: acc.available_balance,
        synced_at: new Date(),
      },
    });
  }

  // Create some demo transactions
  const demoTransactions = [
    { merchant: 'Starbucks', amount: 5.67, is_expense: true, category: 'food_and_drink' },
    { merchant: 'Whole Foods', amount: 127.43, is_expense: true, category: 'food_and_drink' },
    { merchant: 'Amazon', amount: 49.99, is_expense: true, category: 'shopping' },
    { merchant: 'Uber', amount: 24.50, is_expense: true, category: 'transportation' },
    { merchant: 'Salary Deposit', amount: 5000.00, is_expense: false, category: 'income' },
  ];

  for (const txn of demoTransactions) {
    await prisma.transactions.create({
      data: {
        user_id: userId,
        bank_connection_id: connectionId,
        amount: txn.amount,
        is_expense: txn.is_expense,
        merchant: txn.merchant,
        description: txn.merchant,
        date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        category: txn.category,
        plaid_transaction_id: `demo-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        updated_at: new Date(),
      },
    });
  }
}

// Helper to create accounts from metadata (for Yodlee demo)
async function createDemoAccountsFromMetadata(connectionId: string, userId: string, accounts: any[], institutionName?: string) {
  for (const acc of accounts) {
    await prisma.bank_accounts.create({
      data: {
        bank_connection_id: connectionId,
        user_id: userId,
        plaid_account_id: acc.id || `yodlee-acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: acc.name || `${institutionName || 'Bank'} Account`,
        account_type: acc.type || 'depository',
        account_subtype: acc.subtype || 'checking',
        current_balance: acc.balance?.current || acc.current_balance || 0,
        available_balance: acc.balance?.available || acc.available_balance || 0,
        synced_at: new Date(),
      },
    });
  }

  // Create some demo transactions for each account
  const demoTransactions = [
    { merchant: 'Woolworths', amount: 85.43, is_expense: true, category: 'groceries' },
    { merchant: 'BP Petrol', amount: 67.50, is_expense: true, category: 'transportation' },
    { merchant: 'Netflix', amount: 19.99, is_expense: true, category: 'entertainment' },
    { merchant: 'Salary Deposit', amount: 3500.00, is_expense: false, category: 'income' },
  ];

  for (const txn of demoTransactions) {
    await prisma.transactions.create({
      data: {
        user_id: userId,
        bank_connection_id: connectionId,
        amount: txn.amount,
        is_expense: txn.is_expense,
        merchant: txn.merchant,
        description: txn.merchant,
        date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        category: txn.category,
        plaid_transaction_id: `yodlee-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        updated_at: new Date(),
      },
    });
  }
}

// Get all connected accounts across all providers
router.get('/accounts', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    
    const connections = await prisma.bank_connections.findMany({
      where: { 
        user_id: userId, 
        disconnected_at: null,
      },
      include: { 
        bank_accounts: {
          where: { is_hidden: false }
        } 
      },
      orderBy: { connected_at: 'desc' },
    });

    // Format the response to match frontend expectations
    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      provider: conn.provider,
      institutionName: conn.institution_name,
      institutionLogoUrl: conn.institution_logo_url,
      institutionId: conn.plaid_item_id,
      syncStatus: conn.sync_status,
      lastSyncedAt: conn.last_synced_at,
      accounts: conn.bank_accounts.map(acc => ({
        id: acc.id,
        providerAccountId: acc.plaid_account_id,
        name: acc.name,
        accountType: acc.account_type,
        accountSubtype: acc.account_subtype,
        currentBalance: Number(acc.current_balance || 0),
        availableBalance: Number(acc.available_balance || 0),
        currency: 'USD',
        mask: acc.plaid_account_id?.slice(-4),
      })),
    }));

    res.json({ connections: formattedConnections });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    next(error);
  }
});

// Get accounts for a specific connection
router.get('/accounts/:connectionId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;

    const accounts = await prisma.bank_accounts.findMany({
      where: { 
        bank_connection_id: connectionId,
        bank_connections: { user_id: userId },
        is_hidden: false,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ accounts });
  } catch (error) {
    console.error('Error fetching connection accounts:', error);
    next(error);
  }
});

// Sync specific connection
router.post('/sync/:connectionId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;
    const { force = false } = req.body;

    const connection = await prisma.bank_connections.findFirst({
      where: { id: connectionId, user_id: userId, disconnected_at: null },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Skip sync for demo connections
    if (connection.plaid_access_token?.startsWith('demo-')) {
      return res.json({ 
        success: true, 
        skipped: false,
        message: 'Demo connection synced' 
      });
    }

    // Check if sync is needed (throttle unless force)
    if (!force && connection.last_synced_at) {
      const lastSync = new Date(connection.last_synced_at);
      const minutesSinceSync = (Date.now() - lastSync.getTime()) / 60000;
      if (minutesSinceSync < 5) {
        return res.json({ 
          success: true, 
          skipped: true, 
          message: 'Synced recently. Use force=true to override.' 
        });
      }
    }

    await syncConnection(connection);

    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing connection:', error);
    next(error);
  }
});

// Sync all connections for user
router.post('/sync-all', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;

    const connections = await prisma.bank_connections.findMany({
      where: { user_id: userId, disconnected_at: null },
    });

    const results = await Promise.allSettled(
      connections.map(conn => syncConnection(conn))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({ 
      success: true, 
      synced: successful, 
      failed,
      total: connections.length 
    });
  } catch (error) {
    console.error('Error syncing all connections:', error);
    next(error);
  }
});

// Disconnect specific account
router.delete('/accounts/:accountId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { accountId } = req.params;

    await prisma.bank_accounts.updateMany({
      where: { 
        id: accountId,
        bank_connections: { user_id: userId }
      },
      data: { is_hidden: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    next(error);
  }
});

// Disconnect entire connection
router.delete('/connections/:connectionId', async (req: any, res: any, next: any) => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;

    const connection = await prisma.bank_connections.findFirst({
      where: { id: connectionId, user_id: userId },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Notify provider to revoke access (skip for demo)
    if (!connection.plaid_access_token?.startsWith('demo-')) {
      const providerInstance = providers[connection.provider as keyof typeof providers] || providers.plaid;
      if (providerInstance?.revokeAccess) {
        try {
          await providerInstance.revokeAccess(connection.plaid_access_token);
        } catch (e) {
          console.error('Failed to revoke provider access:', e);
        }
      }
    }

    // Soft delete connection
    await prisma.bank_connections.update({
      where: { id: connectionId },
      data: { 
        disconnected_at: new Date(),
        plaid_access_token: null,
        sync_status: 'disconnected',
      },
    });

    // Mark accounts as hidden
    await prisma.bank_accounts.updateMany({
      where: { bank_connection_id: connectionId },
      data: { is_hidden: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting connection:', error);
    next(error);
  }
});

// Webhook handler (unified)
router.post('/webhook/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const providerInstance = providers[provider as keyof typeof providers];
    
    if (!providerInstance?.handleWebhook) {
      return res.sendStatus(200);
    }

    const result = await providerInstance.handleWebhook(req.body);
    
    if (result.itemId) {
      const connection = await prisma.bank_connections.findFirst({
        where: { plaid_item_id: result.itemId },
      });

      if (connection) {
        await syncConnection(connection);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200);
  }
});

// Helper: Sync a connection
async function syncConnection(connection: any) {
  // Skip demo connections
  if (connection.plaid_access_token?.startsWith('demo-')) {
    return;
  }

  await prisma.bank_connections.update({
    where: { id: connection.id },
    data: { sync_status: 'syncing' },
  });

  try {
    const providerInstance = providers[connection.provider as keyof typeof providers] || plaidProvider;
    
    // Sync accounts
    const accounts = await providerInstance.getAccounts(connection.plaid_access_token);
    
    for (const acc of accounts) {
      await prisma.bank_accounts.upsert({
        where: {
          bank_connection_id_plaid_account_id: {
            bank_connection_id: connection.id,
            plaid_account_id: acc.id,
          },
        },
        update: {
          name: acc.name,
          account_type: acc.type,
          account_subtype: acc.subtype,
          current_balance: acc.balance?.current,
          available_balance: acc.balance?.available,
          synced_at: new Date(),
        },
        create: {
          bank_connection_id: connection.id,
          user_id: connection.user_id,
          plaid_account_id: acc.id,
          name: acc.name,
          account_type: acc.type,
          account_subtype: acc.subtype,
          current_balance: acc.balance?.current,
          available_balance: acc.balance?.available,
          synced_at: new Date(),
        },
      });
    }

    // Sync transactions (last 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const transactions = await providerInstance.getTransactions(
      connection.plaid_access_token,
      startDate,
      new Date()
    );

    for (const txn of transactions) {
      await prisma.transactions.upsert({
        where: {
          user_id_plaid_transaction_id: {
            user_id: connection.user_id,
            plaid_transaction_id: txn.id,
          },
        },
        update: {
          amount: Math.abs(txn.amount),
          pending: txn.pending,
          updated_at: new Date(),
        },
        create: {
          user_id: connection.user_id,
          bank_connection_id: connection.id,
          account_id: txn.accountId,
          amount: Math.abs(txn.amount),
          is_expense: txn.amount > 0,
          merchant: txn.merchant || txn.description,
          description: txn.description,
          date: new Date(txn.date),
          category: txn.category || 'other',
          pending: txn.pending,
          plaid_transaction_id: txn.id,
          updated_at: new Date(),
        },
      });
    }

    await prisma.bank_connections.update({
      where: { id: connection.id },
      data: {
        last_synced_at: new Date(),
        sync_status: 'synced',
        sync_error_message: null,
        sync_error_count: 0,
      },
    });
  } catch (error) {
    console.error(`Sync error for connection ${connection.id}:`, error);
    await prisma.bank_connections.update({
      where: { id: connection.id },
      data: {
        sync_status: 'error',
        sync_error_message: error instanceof Error ? error.message : 'Unknown error',
        sync_error_count: { increment: 1 },
      },
    });
    throw error;
  }
}

export { router as bankRouter };

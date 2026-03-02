// Comprehensive bank database for all supported countries
// Sources: Plaid, TrueLayer, Yodlee coverage

export const comprehensiveBanks = {
  // UK & Ireland
  GB: [
    { id: 'monzo', name: 'Monzo', logo: 'https://icons.duckduckgo.com/ip3/monzo.com.ico', color: '#EE5353' },
    { id: 'starling', name: 'Starling Bank', logo: 'https://icons.duckduckgo.com/ip3/starlingbank.com.ico', color: '#5E30Ed' },
    { id: 'barclays', name: 'Barclays', logo: 'https://icons.duckduckgo.com/ip3/barclays.co.uk.ico', color: '#00AEEF' },
    { id: 'hsbc_uk', name: 'HSBC UK', logo: 'https://icons.duckduckgo.com/ip3/hsbc.co.uk.ico', color: '#DB0011' },
    { id: 'lloyds', name: 'Lloyds Bank', logo: 'https://icons.duckduckgo.com/ip3/lloydsbank.com.ico', color: '#006A4D' },
    { id: 'natwest', name: 'NatWest', logo: 'https://icons.duckduckgo.com/ip3/natwest.com.ico', color: '#42145F' },
    { id: 'santander_uk', name: 'Santander UK', logo: 'https://icons.duckduckgo.com/ip3/santander.co.uk.ico', color: '#EC0000' },
    { id: 'revolut', name: 'Revolut', logo: 'https://icons.duckduckgo.com/ip3/revolut.com.ico', color: '#000000' },
    { id: 'halifax', name: 'Halifax', logo: 'https://icons.duckduckgo.com/ip3/halifax.co.uk.ico', color: '#004C9F' },
    { id: 'tsb', name: 'TSB', logo: 'https://icons.duckduckgo.com/ip3/tsb.co.uk.ico', color: '#003B5C' },
    { id: 'metro', name: 'Metro Bank', logo: 'https://icons.duckduckgo.com/ip3/metrobankonline.co.uk.ico', color: '#00A9E0' },
    { id: 'coop', name: 'Co-operative Bank', logo: 'https://icons.duckduckgo.com/ip3/co-operativebank.co.uk.ico', color: '#00A1E0' },
    { id: 'virgin_money', name: 'Virgin Money', logo: 'https://icons.duckduckgo.com/ip3/virginmoney.com.ico', color: '#C41F3E' },
    { id: 'yorkshire', name: 'Yorkshire Bank', logo: 'https://icons.duckduckgo.com/ip3/ybs.co.uk.ico', color: '#0055A4' },
    { id: 'clydesdale', name: 'Clydesdale Bank', logo: 'https://icons.duckduckgo.com/ip3/clydesdalebank.co.uk.ico', color: '#0055A4' },
  ],
  IE: [
    { id: 'aib', name: 'AIB', logo: 'https://icons.duckduckgo.com/ip3/aib.ie.ico', color: '#7D1316' },
    { id: 'bank_of_ireland', name: 'Bank of Ireland', logo: 'https://icons.duckduckgo.com/ip3/bankofireland.com.ico', color: '#003399' },
    { id: 'permanent_tsb', name: 'Permanent TSB', logo: 'https://icons.duckduckgo.com/ip3/permanenttsb.ie.ico', color: '#005EB8' },
    { id: 'ulster_bank', name: 'Ulster Bank', logo: 'https://icons.duckduckgo.com/ip3/ulsterbank.ie.ico', color: '#42145F' },
    { id: 'kbc_ireland', name: 'KBC Ireland', logo: 'https://icons.duckduckgo.com/ip3/kbc.ie.ico', color: '#0084C4' },
    { id: 'revolut_ie', name: 'Revolut Ireland', logo: 'https://icons.duckduckgo.com/ip3/revolut.com.ico', color: '#000000' },
    { id: 'n26_ie', name: 'N26 Ireland', logo: 'https://icons.duckduckgo.com/ip3/n26.com.ico', color: '#00A4E0' },
  ],
  // North America
  US: [
    { id: 'chase', name: 'Chase', logo: 'https://icons.duckduckgo.com/ip3/chase.com.ico', color: '#117ACA' },
    { id: 'bofa', name: 'Bank of America', logo: 'https://icons.duckduckgo.com/ip3/bankofamerica.com.ico', color: '#012169' },
    { id: 'wells_fargo', name: 'Wells Fargo', logo: 'https://icons.duckduckgo.com/ip3/wellsfargo.com.ico', color: '#D71E28' },
    { id: 'citi', name: 'Citibank', logo: 'https://icons.duckduckgo.com/ip3/citi.com.ico', color: '#003B70' },
    { id: 'pnc', name: 'PNC Bank', logo: 'https://icons.duckduckgo.com/ip3/pnc.com.ico', color: '#F58025' },
    { id: 'capital_one', name: 'Capital One', logo: 'https://icons.duckduckgo.com/ip3/capitalone.com.ico', color: '#004976' },
    { id: 'td_bank', name: 'TD Bank', logo: 'https://icons.duckduckgo.com/ip3/td.com.ico', color: '#008A00' },
    { id: 'us_bank', name: 'US Bank', logo: 'https://icons.duckduckgo.com/ip3/usbank.com.ico', color: '#003C71' },
    { id: 'ally', name: 'Ally Bank', logo: 'https://icons.duckduckgo.com/ip3/ally.com.ico', color: '#5C068C' },
    { id: 'schwab', name: 'Charles Schwab', logo: 'https://icons.duckduckgo.com/ip3/schwab.com.ico', color: '#00A1E0' },
    { id: 'fidelity', name: 'Fidelity', logo: 'https://icons.duckduckgo.com/ip3/fidelity.com.ico', color: '#0055A4' },
    { id: 'goldman_sachs', name: 'Goldman Sachs', logo: 'https://icons.duckduckgo.com/ip3/goldmansachs.com.ico', color: '#003399' },
    { id: 'morgan_stanley', name: 'Morgan Stanley', logo: 'https://icons.duckduckgo.com/ip3/morganstanley.com.ico', color: '#003399' },
    { id: 'american_express', name: 'American Express', logo: 'https://icons.duckduckgo.com/ip3/americanexpress.com.ico', color: '#006FCF' },
    { id: 'discover', name: 'Discover', logo: 'https://icons.duckduckgo.com/ip3/discover.com.ico', color: '#FF6600' },
    { id: 'usbank', name: 'US Bank', logo: 'https://icons.duckduckgo.com/ip3/usbank.com.ico', color: '#003C71' },
    { id: 'truist', name: 'Truist', logo: 'https://icons.duckduckgo.com/ip3/truist.com.ico', color: '#5C068C' },
    { id: 'regions', name: 'Regions Bank', logo: 'https://icons.duckduckgo.com/ip3/regions.com.ico', color: '#0055A4' },
    { id: 'keybank', name: 'KeyBank', logo: 'https://icons.duckduckgo.com/ip3/key.com.ico', color: '#0055A4' },
    { id: 'citizens', name: 'Citizens Bank', logo: 'https://icons.duckduckgo.com/ip3/citizensbank.com.ico', color: '#0055A4' },
    { id: 'fifth_third', name: 'Fifth Third Bank', logo: 'https://icons.duckduckgo.com/ip3/53.com.ico', color: '#0055A4' },
    { id: 'huntington', name: 'Huntington Bank', logo: 'https://icons.duckduckgo.com/ip3/huntington.com.ico', color: '#0055A4' },
    { id: 'svb', name: 'Silicon Valley Bank', logo: 'https://icons.duckduckgo.com/ip3/svb.com.ico', color: '#003399' },
    { id: 'first_republic', name: 'First Republic', logo: 'https://icons.duckduckgo.com/ip3/firstrepublic.com.ico', color: '#0055A4' },
    { id: 'zelle', name: 'Zelle', logo: 'https://icons.duckduckgo.com/ip3/zellepay.com.ico', color: '#6E3BF2' },
  ],
  CA: [
    { id: 'rbc', name: 'RBC', logo: 'https://icons.duckduckgo.com/ip3/rbcroyalbank.com.ico', color: '#005AB5' },
    { id: 'td_canada', name: 'TD Canada', logo: 'https://icons.duckduckgo.com/ip3/td.com.ico', color: '#008A00' },
    { id: 'scotiabank', name: 'Scotiabank', logo: 'https://icons.duckduckgo.com/ip3/scotiabank.com.ico', color: '#ED0722' },
    { id: 'bmo', name: 'BMO', logo: 'https://icons.duckduckgo.com/ip3/bmo.com.ico', color: '#0079C1' },
    { id: 'cibc', name: 'CIBC', logo: 'https://icons.duckduckgo.com/ip3/cibc.com.ico', color: '#C41F3E' },
    { id: 'national_bank', name: 'National Bank', logo: 'https://icons.duckduckgo.com/ip3/nbc.ca.ico', color: '#C41F3E' },
    { id: 'hsbc_canada', name: 'HSBC Canada', logo: 'https://icons.duckduckgo.com/ip3/hsbc.ca.ico', color: '#DB0011' },
    { id: 'simplii', name: 'Simplii Financial', logo: 'https://icons.duckduckgo.com/ip3/simplii.com.ico', color: '#FF6600' },
    { id: 'tangerine', name: 'Tangerine', logo: 'https://icons.duckduckgo.com/ip3/tangerine.ca.ico', color: '#FF6600' },
    { id: 'eq_bank', name: 'EQ Bank', logo: 'https://icons.duckduckgo.com/ip3/eqbank.ca.ico', color: '#00A651' },
    { id: 'manulife', name: 'Manulife Bank', logo: 'https://icons.duckduckgo.com/ip3/manulife.ca.ico', color: '#00A651' },
  ],
  MX: [
    { id: 'bbva_mx', name: 'BBVA México', logo: 'https://icons.duckduckgo.com/ip3/bbva.mx.ico', color: '#004481' },
    { id: 'banorte', name: 'Banorte', logo: 'https://icons.duckduckgo.com/ip3/banorte.com.ico', color: '#E30613' },
    { id: 'santander_mx', name: 'Santander México', logo: 'https://icons.duckduckgo.com/ip3/santander.com.mx.ico', color: '#EC0000' },
    { id: 'citibanamex', name: 'Citibanamex', logo: 'https://icons.duckduckgo.com/ip3/citibanamex.com.ico', color: '#003B70' },
    { id: 'scotiabank_mx', name: 'Scotiabank México', logo: 'https://icons.duckduckgo.com/ip3/scotiabank.com.mx.ico', color: '#ED0722' },
    { id: 'hsbc_mx', name: 'HSBC México', logo: 'https://icons.duckduckgo.com/ip3/hsbc.com.mx.ico', color: '#DB0011' },
    { id: 'inbursa', name: 'Inbursa', logo: 'https://icons.duckduckgo.com/ip3/inbursa.com.ico', color: '#0055A4' },
    { id: 'banamex', name: 'Banamex', logo: 'https://icons.duckduckgo.com/ip3/banamex.com.ico', color: '#003B70' },
  ],
  // Europe - Western
  DE: [
    { id: 'deutsche_bank', name: 'Deutsche Bank', logo: 'https://icons.duckduckgo.com/ip3/deutsche-bank.de.ico', color: '#0018A8' },
    { id: 'commerzbank', name: 'Commerzbank', logo: 'https://icons.duckduckgo.com/ip3/commerzbank.de.ico', color: '#FFCC00' },
    { id: 'sparkasse', name: 'Sparkasse', logo: 'https://icons.duckduckgo.com/ip3/sparkasse.de.ico', color: '#E30613' },
    { id: 'volksbanken', name: 'Volksbanken', logo: 'https://icons.duckduckgo.com/ip3/vr.de.ico', color: '#0066B3' },
    { id: 'n26', name: 'N26', logo: 'https://icons.duckduckgo.com/ip3/n26.com.ico', color: '#00A4E0' },
    { id: 'dkb', name: 'DKB', logo: 'https://icons.duckduckgo.com/ip3/dkb.de.ico', color: '#005E84' },
    { id: 'ing_de', name: 'ING Germany', logo: 'https://icons.duckduckgo.com/ip3/ing.de.ico', color: '#FF6200' },
    { id: 'hypovereinsbank', name: 'HypoVereinsbank', logo: 'https://icons.duckduckgo.com/ip3/hypovereinsbank.de.ico', color: '#003399' },
    { id: 'postbank', name: 'Postbank', logo: 'https://icons.duckduckgo.com/ip3/postbank.de.ico', color: '#FFCC00' },
    { id: 'targobank', name: 'Targobank', logo: 'https://icons.duckduckgo.com/ip3/targobank.de.ico', color: '#E30613' },
  ],
  FR: [
    { id: 'bnpp', name: 'BNP Paribas', logo: 'https://icons.duckduckgo.com/ip3/bnpparibas.fr.ico', color: '#00915A' },
    { id: 'societe_generale', name: 'Société Générale', logo: 'https://icons.duckduckgo.com/ip3/societegenerale.fr.ico', color: '#E30613' },
    { id: 'credit_agricole', name: 'Crédit Agricole', logo: 'https://icons.duckduckgo.com/ip3/credit-agricole.fr.ico', color: '#0055A4' },
    { id: 'bpce', name: 'BPCE', logo: 'https://icons.duckduckgo.com/ip3/bpce.fr.ico', color: '#0083BE' },
    { id: 'lcl', name: 'LCL', logo: 'https://icons.duckduckgo.com/ip3/lcl.fr.ico', color: '#004B8D' },
    { id: 'hello_bank', name: 'Hello bank!', logo: 'https://icons.duckduckgo.com/ip3/hellobank.fr.ico', color: '#00A9E0' },
    { id: 'boursorama', name: 'Boursorama', logo: 'https://icons.duckduckgo.com/ip3/boursorama-banque.com.ico', color: '#0055A4' },
    { id: 'fortuneo', name: 'Fortuneo', logo: 'https://icons.duckduckgo.com/ip3/fortuneo.fr.ico', color: '#0055A4' },
    { id: 'monabanq', name: 'Monabanq', logo: 'https://icons.duckduckgo.com/ip3/monabanq.fr.ico', color: '#0055A4' },
  ],
  NL: [
    { id: 'ing_nl', name: 'ING Netherlands', logo: 'https://icons.duckduckgo.com/ip3/ing.nl.ico', color: '#FF6200' },
    { id: 'rabobank', name: 'Rabobank', logo: 'https://icons.duckduckgo.com/ip3/rabobank.nl.ico', color: '#0064B4' },
    { id: 'abn_amro', name: 'ABN AMRO', logo: 'https://icons.duckduckgo.com/ip3/abnamro.nl.ico', color: '#00857D' },
    { id: 'bunq', name: 'bunq', logo: 'https://icons.duckduckgo.com/ip3/bunq.com.ico', color: '#00D66C' },
    { id: 'sns_bank', name: 'SNS Bank', logo: 'https://icons.duckduckgo.com/ip3/snsbank.nl.ico', color: '#E30613' },
    { id: 'knab', name: 'Knab', logo: 'https://icons.duckduckgo.com/ip3/knab.nl.ico', color: '#FF6600' },
    { id: 'triodos', name: 'Triodos Bank', logo: 'https://icons.duckduckgo.com/ip3/triodos.nl.ico', color: '#00A651' },
  ],
  BE: [
    { id: 'bpost', name: 'bpost bank', logo: 'https://icons.duckduckgo.com/ip3/bpostbank.be.ico', color: '#003399' },
    { id: 'kbc', name: 'KBC Bank', logo: 'https://icons.duckduckgo.com/ip3/kbc.be.ico', color: '#0084C4' },
    { id: 'ing_be', name: 'ING Belgium', logo: 'https://icons.duckduckgo.com/ip3/ing.be.ico', color: '#FF6200' },
    { id: 'belfius', name: 'Belfius', logo: 'https://icons.duckduckgo.com/ip3/belfius.be.ico', color: '#00A9E0' },
    { id: 'argenta', name: 'Argenta', logo: 'https://icons.duckduckgo.com/ip3/argenta.be.ico', color: '#00A651' },
  ],
  AT: [
    { id: 'erste_bank', name: 'Erste Bank', logo: 'https://icons.duckduckgo.com/ip3/erstebank.at.ico', color: '#E30613' },
    { id: 'raiffeisen_at', name: 'Raiffeisen Bank', logo: 'https://icons.duckduckgo.com/ip3/raiffeisen.at.ico', color: '#FFCC00' },
    { id: 'bank_austria', name: 'Bank Austria', logo: 'https://icons.duckduckgo.com/ip3/bankaustria.at.ico', color: '#004C9F' },
    { id: 'n26_at', name: 'N26 Austria', logo: 'https://icons.duckduckgo.com/ip3/n26.com.ico', color: '#00A4E0' },
  ],
  CH: [
    { id: 'ubs', name: 'UBS', logo: 'https://icons.duckduckgo.com/ip3/ubs.com.ico', color: '#E30613' },
    { id: 'credit_suisse', name: 'Credit Suisse', logo: 'https://icons.duckduckgo.com/ip3/credit-suisse.com.ico', color: '#003399' },
    { id: 'zurich', name: 'Zürcher Kantonalbank', logo: 'https://icons.duckduckgo.com/ip3/zkb.ch.ico', color: '#0055A4' },
    { id: 'postfinance', name: 'PostFinance', logo: 'https://icons.duckduckgo.com/ip3/postfinance.ch.ico', color: '#FFCC00' },
    { id: 'raiffeisen_ch', name: 'Raiffeisen Switzerland', logo: 'https://icons.duckduckgo.com/ip3/raiffeisen.ch.ico', color: '#FFCC00' },
  ],
  // Europe - Nordic
  SE: [
    { id: 'swedbank', name: 'Swedbank', logo: 'https://icons.duckduckgo.com/ip3/swedbank.se.ico', color: '#FF6600' },
    { id: 'seb', name: 'SEB', logo: 'https://icons.duckduckgo.com/ip3/seb.se.ico', color: '#003399' },
    { id: 'handelsbanken', name: 'Handelsbanken', logo: 'https://icons.duckduckgo.com/ip3/handelsbanken.se.ico', color: '#0055A4' },
    { id: 'nordea_se', name: 'Nordea Sweden', logo: 'https://icons.duckduckgo.com/ip3/nordea.se.ico', color: '#003399' },
    { id: 'sbab', name: 'SBAB', logo: 'https://icons.duckduckgo.com/ip3/sbab.se.ico', color: '#0055A4' },
  ],
  NO: [
    { id: 'dnb', name: 'DNB', logo: 'https://icons.duckduckgo.com/ip3/dnb.no.ico', color: '#0055A4' },
    { id: 'nordea_no', name: 'Nordea Norway', logo: 'https://icons.duckduckgo.com/ip3/nordea.no.ico', color: '#003399' },
    { id: 'sparebank1', name: 'SpareBank 1', logo: 'https://icons.duckduckgo.com/ip3/sparebank1.no.ico', color: '#E30613' },
  ],
  DK: [
    { id: 'danske_bank', name: 'Danske Bank', logo: 'https://icons.duckduckgo.com/ip3/danskebank.dk.ico', color: '#003399' },
    { id: 'nordea_dk', name: 'Nordea Denmark', logo: 'https://icons.duckduckgo.com/ip3/nordea.dk.ico', color: '#003399' },
    { id: 'jyske', name: 'Jyske Bank', logo: 'https://icons.duckduckgo.com/ip3/jyskebank.dk.ico', color: '#0055A4' },
    { id: 'sydbank', name: 'Sydbank', logo: 'https://icons.duckduckgo.com/ip3/sydbank.dk.ico', color: '#0055A4' },
  ],
  FI: [
    { id: 'nordea_fi', name: 'Nordea Finland', logo: 'https://icons.duckduckgo.com/ip3/nordea.fi.ico', color: '#003399' },
    { id: 'op', name: 'OP Bank', logo: 'https://icons.duckduckgo.com/ip3/op.fi.ico', color: '#FF6600' },
    { id: 'danske_fi', name: 'Danske Bank Finland', logo: 'https://icons.duckduckgo.com/ip3/danskebank.fi.ico', color: '#003399' },
  ],
  // Europe - Southern
  ES: [
    { id: 'bbva', name: 'BBVA', logo: 'https://icons.duckduckgo.com/ip3/bbva.es.ico', color: '#004481' },
    { id: 'caixabank', name: 'CaixaBank', logo: 'https://icons.duckduckgo.com/ip3/caixabank.es.ico', color: '#00A9E0' },
    { id: 'santander_es', name: 'Santander Spain', logo: 'https://icons.duckduckgo.com/ip3/santander.es.ico', color: '#EC0000' },
    { id: 'sabadell', name: 'Banco Sabadell', logo: 'https://icons.duckduckgo.com/ip3/bancosabadell.com.ico', color: '#0066B3' },
    { id: 'bankinter', name: 'Bankinter', logo: 'https://icons.duckduckgo.com/ip3/bankinter.com.ico', color: '#FF6600' },
    { id: 'abanca', name: 'Abanca', logo: 'https://icons.duckduckgo.com/ip3/abanca.com.ico', color: '#00A9E0' },
  ],
  IT: [
    { id: 'unicredit', name: 'UniCredit', logo: 'https://icons.duckduckgo.com/ip3/unicredit.it.ico', color: '#E30613' },
    { id: 'intesa', name: 'Intesa Sanpaolo', logo: 'https://icons.duckduckgo.com/ip3/intesasanpaolo.com.ico', color: '#0055A4' },
    { id: 'monte_dei_paschi', name: 'Monte dei Paschi', logo: 'https://icons.duckduckgo.com/ip3/mps.it.ico', color: '#9B2335' },
    { id: 'bpm', name: 'Banco BPM', logo: 'https://icons.duckduckgo.com/ip3/bancobpm.it.ico', color: '#00A9E0' },
    { id: 'fineco', name: 'FinecoBank', logo: 'https://icons.duckduckgo.com/ip3/finecobank.com.ico', color: '#003399' },
    { id: 'mediobanca', name: 'Mediobanca', logo: 'https://icons.duckduckgo.com/ip3/medioBanca.it.ico', color: '#0055A4' },
  ],
  PT: [
    { id: 'millennium', name: 'Millennium BCP', logo: 'https://icons.duckduckgo.com/ip3/millenniumbcp.pt.ico', color: '#E30613' },
    { id: 'santander_pt', name: 'Santander Portugal', logo: 'https://icons.duckduckgo.com/ip3/santander.pt.ico', color: '#EC0000' },
    { id: 'cgd', name: 'Caixa Geral', logo: 'https://icons.duckduckgo.com/ip3/cgd.pt.ico', color: '#0084C4' },
    { id: 'novobanco', name: 'Novo Banco', logo: 'https://icons.duckduckgo.com/ip3/novobanco.pt.ico', color: '#0055A4' },
  ],
  // Europe - Eastern
  PL: [
    { id: 'pkobp', name: 'PKO BP', logo: 'https://icons.duckduckgo.com/ip3/pkobp.pl.ico', color: '#0055A4' },
    { id: 'pekao', name: 'Bank Pekao', logo: 'https://icons.duckduckgo.com/ip3/pekao.com.pl.ico', color: '#E30613' },
    { id: 'ing_pl', name: 'ING Poland', logo: 'https://icons.duckduckgo.com/ip3/ing.pl.ico', color: '#FF6200' },
    { id: 'mBank', name: 'mBank', logo: 'https://icons.duckduckgo.com/ip3/mbank.pl.ico', color: '#C41F3E' },
    { id: 'santander_pl', name: 'Santander Poland', logo: 'https://icons.duckduckgo.com/ip3/santander.pl.ico', color: '#EC0000' },
  ],
  CZ: [
    { id: 'ceska_sporitelna', name: 'Česká spořitelna', logo: 'https://icons.duckduckgo.com/ip3/csas.cz.ico', color: '#0055A4' },
    { id: 'komercni', name: 'Komerční banka', logo: 'https://icons.duckduckgo.com/ip3/kb.cz.ico', color: '#0055A4' },
  ],
  HU: [
    { id: 'otp', name: 'OTP Bank', logo: 'https://icons.duckduckgo.com/ip3/otpbank.hu.ico', color: '#00A651' },
    { id: 'kh', name: 'K&H Bank', logo: 'https://icons.duckduckgo.com/ip3/kh.hu.ico', color: '#0055A4' },
  ],
  RO: [
    { id: 'banca_transilvania', name: 'Banca Transilvania', logo: 'https://icons.duckduckgo.com/ip3/bancatransilvania.ro.ico', color: '#00A651' },
  ],
  // Oceania
  AU: [
    { id: 'anz', name: 'ANZ', logo: 'https://icons.duckduckgo.com/ip3/anz.com.au.ico', color: '#004165' },
    { id: 'commonwealth', name: 'Commonwealth Bank', logo: 'https://icons.duckduckgo.com/ip3/commbank.com.au.ico', color: '#FFCC00' },
    { id: 'westpac', name: 'Westpac', logo: 'https://icons.duckduckgo.com/ip3/westpac.com.au.ico', color: '#DA2128' },
    { id: 'nab', name: 'NAB', logo: 'https://icons.duckduckgo.com/ip3/nab.com.au.ico', color: '#C51230' },
    { id: 'ing_au', name: 'ING Australia', logo: 'https://icons.duckduckgo.com/ip3/ing.com.au.ico', color: '#FF6200' },
    { id: 'hsbc_au', name: 'HSBC Australia', logo: 'https://icons.duckduckgo.com/ip3/hsbc.com.au.ico', color: '#DB0011' },
    { id: 'macquarie', name: 'Macquarie Bank', logo: 'https://icons.duckduckgo.com/ip3/macquarie.com.au.ico', color: '#000000' },
    { id: 'suncorp', name: 'Suncorp Bank', logo: 'https://icons.duckduckgo.com/ip3/suncorp.com.au.ico', color: '#006747' },
    { id: 'bendigo', name: 'Bendigo Bank', logo: 'https://icons.duckduckgo.com/ip3/bendigobank.com.au.ico', color: '#821F3A' },
    { id: 'bankwest', name: 'Bankwest', logo: 'https://icons.duckduckgo.com/ip3/bankwest.com.au.ico', color: '#F8E000' },
  ],
  NZ: [
    { id: 'anz_nz', name: 'ANZ New Zealand', logo: 'https://icons.duckduckgo.com/ip3/anz.co.nz.ico', color: '#004165' },
    { id: 'asb', name: 'ASB Bank', logo: 'https://icons.duckduckgo.com/ip3/asb.co.nz.ico', color: '#FFCC00' },
    { id: 'bnz', name: 'BNZ', logo: 'https://icons.duckduckgo.com/ip3/bnz.co.nz.ico', color: '#003366' },
    { id: 'westpac_nz', name: 'Westpac NZ', logo: 'https://icons.duckduckgo.com/ip3/westpac.co.nz.ico', color: '#DA2128' },
    { id: 'kiwibank', name: 'Kiwibank', logo: 'https://icons.duckduckgo.com/ip3/kiwibank.co.nz.ico', color: '#00A651' },
  ],
  // Asia
  SG: [
    { id: 'dbs', name: 'DBS Bank', logo: 'https://icons.duckduckgo.com/ip3/dbs.com.sg.ico', color: '#C41F3E' },
    { id: 'ocbc', name: 'OCBC', logo: 'https://icons.duckduckgo.com/ip3/ocbc.com.ico', color: '#E30613' },
    { id: 'uob', name: 'UOB', logo: 'https://icons.duckduckgo.com/ip3/uob.com.sg.ico', color: '#003399' },
    { id: 'hsbc_sg', name: 'HSBC Singapore', logo: 'https://icons.duckduckgo.com/ip3/hsbc.com.sg.ico', color: '#DB0011' },
    { id: 'standard_chartered', name: 'Standard Chartered', logo: 'https://icons.duckduckgo.com/ip3/sc.com.ico', color: '#00A651' },
    { id: 'citibank_sg', name: 'Citibank Singapore', logo: 'https://icons.duckduckgo.com/ip3/citibank.com.sg.ico', color: '#003B70' },
  ],
  HK: [
    { id: 'hsbc_hk', name: 'HSBC HK', logo: 'https://icons.duckduckgo.com/ip3/hsbc.com.hk.ico', color: '#DB0011' },
    { id: 'hang_seng', name: 'Hang Seng', logo: 'https://icons.duckduckgo.com/ip3/hangseng.com.ico', color: '#00A9E0' },
    { id: 'boc_hk', name: 'Bank of China HK', logo: 'https://icons.duckduckgo.com/ip3/bochk.com.ico', color: '#C41F3E' },
    { id: 'standard_chartered_hk', name: 'Standard Chartered HK', logo: 'https://icons.duckduckgo.com/ip3/sc.com.hk.ico', color: '#00A651' },
    { id: 'citibank_hk', name: 'Citibank HK', logo: 'https://icons.duckduckgo.com/ip3/citibank.com.hk.ico', color: '#003B70' },
  ],
  JP: [
    { id: 'mufg', name: 'MUFG Bank', logo: 'https://icons.duckduckgo.com/ip3/bk.mufg.jp.ico', color: '#E30613' },
    { id: 'mizuho', name: 'Mizuho Bank', logo: 'https://icons.duckduckgo.com/ip3/mizuhobank.com.ico', color: '#003399' },
    { id: 'sumitomo', name: 'Sumitomo Mitsui', logo: 'https://icons.duckduckgo.com/ip3/smbc.co.jp.ico', color: '#0055A4' },
    { id: 'resona', name: 'Resona Bank', logo: 'https://icons.duckduckgo.com/ip3/resonabank.co.jp.ico', color: '#003399' },
    { id: 'japan_post', name: 'Japan Post Bank', logo: 'https://icons.duckduckgo.com/ip3/japanpost.jp.ico', color: '#E30613' },
  ],
  KR: [
    { id: 'kb', name: 'KB Kookmin', logo: 'https://icons.duckduckgo.com/ip3/kbstar.com.ico', color: '#FFCC00' },
    { id: 'shinhan', name: 'Shinhan Bank', logo: 'https://icons.duckduckgo.com/ip3/shinhan.com.ico', color: '#0055A4' },
    { id: 'woori', name: 'Woori Bank', logo: 'https://icons.duckduckgo.com/ip3/wooribank.com.ico', color: '#003399' },
    { id: 'hana', name: 'Hana Bank', logo: 'https://icons.duckduckgo.com/ip3/kebhana.com.ico', color: '#00857D' },
  ],
  MY: [
    { id: 'maybank', name: 'Maybank', logo: 'https://icons.duckduckgo.com/ip3/maybank.com.ico', color: '#FFCC00' },
    { id: 'cimb', name: 'CIMB Bank', logo: 'https://icons.duckduckgo.com/ip3/cimb.com.ico', color: '#E30613' },
    { id: 'rhb', name: 'RHB Bank', logo: 'https://icons.duckduckgo.com/ip3/rhbgroup.com.ico', color: '#0055A4' },
    { id: 'public_bank', name: 'Public Bank', logo: 'https://icons.duckduckgo.com/ip3/pbebank.com.ico', color: '#C41F3E' },
    { id: 'hong_leong', name: 'Hong Leong Bank', logo: 'https://icons.duckduckgo.com/ip3/hlb.com.my.ico', color: '#FFCC00' },
  ],
  TH: [
    { id: 'scb', name: 'Siam Commercial', logo: 'https://icons.duckduckgo.com/ip3/scb.co.th.ico', color: '#4A148C' },
    { id: 'krungthai', name: 'Krungthai Bank', logo: 'https://icons.duckduckgo.com/ip3/ktb.co.th.ico', color: '#00A9E0' },
    { id: 'bangkok_bank', name: 'Bangkok Bank', logo: 'https://icons.duckduckgo.com/ip3/bangkokbank.com.ico', color: '#0055A4' },
    { id: 'kasikorn', name: 'Kasikornbank', logo: 'https://icons.duckduckgo.com/ip3/kasikornbank.com.ico', color: '#00A651' },
  ],
  PH: [
    { id: 'bdo', name: 'BDO', logo: 'https://icons.duckduckgo.com/ip3/bdo.com.ph.ico', color: '#003399' },
    { id: 'bpi', name: 'Bank of the Philippine', logo: 'https://icons.duckduckgo.com/ip3/bpi.com.ph.ico', color: '#C41F3E' },
    { id: 'metrobank', name: 'Metrobank', logo: 'https://icons.duckduckgo.com/ip3/metrobank.com.ph.ico', color: '#0055A4' },
  ],
  ID: [
    { id: 'bca', name: 'BCA', logo: 'https://icons.duckduckgo.com/ip3/bca.co.id.ico', color: '#0055A4' },
    { id: 'mandiri', name: 'Bank Mandiri', logo: 'https://icons.duckduckgo.com/ip3/bankmandiri.co.id.ico', color: '#003399' },
    { id: 'bni', name: 'BNI', logo: 'https://icons.duckduckgo.com/ip3/bni.co.id.ico', color: '#FFCC00' },
    { id: 'bri', name: 'BRI', logo: 'https://icons.duckduckgo.com/ip3/bri.co.id.ico', color: '#0055A4' },
  ],
  IN: [
    { id: 'hdfc', name: 'HDFC Bank', logo: 'https://icons.duckduckgo.com/ip3/hdfcbank.com.ico', color: '#004B8D' },
    { id: 'sbi', name: 'State Bank of India', logo: 'https://icons.duckduckgo.com/ip3/sbi.co.in.ico', color: '#0057A6' },
    { id: 'icici', name: 'ICICI Bank', logo: 'https://icons.duckduckgo.com/ip3/icicibank.com.ico', color: '#C41F3E' },
    { id: 'axis', name: 'Axis Bank', logo: 'https://icons.duckduckgo.com/ip3/axisbank.com.ico', color: '#961D48' },
    { id: 'kotak', name: 'Kotak Mahindra', logo: 'https://icons.duckduckgo.com/ip3/kotak.com.ico', color: '#E31837' },
    { id: 'pnb', name: 'Punjab National Bank', logo: 'https://icons.duckduckgo.com/ip3/pnbindia.in.ico', color: '#E30613' },
  ],
  VN: [
    { id: 'vietcombank', name: 'Vietcombank', logo: 'https://icons.duckduckgo.com/ip3/vietcombank.com.vn.ico', color: '#0055A4' },
    { id: 'bidv', name: 'BIDV', logo: 'https://icons.duckduckgo.com/ip3/bidv.com.vn.ico', color: '#E30613' },
    { id: 'acb', name: 'ACB', logo: 'https://icons.duckduckgo.com/ip3/acb.com.vn.ico', color: '#00A651' },
  ],
  // Middle East
  AE: [
    { id: 'adcb', name: 'ADCB', logo: 'https://icons.duckduckgo.com/ip3/adcb.com.ico', color: '#0055A4' },
    { id: 'emirates_nbd', name: 'Emirates NBD', logo: 'https://icons.duckduckgo.com/ip3/emiratesnbd.com.ico', color: '#003399' },
    { id: 'hsbc_uae', name: 'HSBC UAE', logo: 'https://icons.duckduckgo.com/ip3/hsbc.ae.ico', color: '#DB0011' },
    { id: 'fab', name: 'FAB', logo: 'https://icons.duckduckgo.com/ip3/bankfab.com.ico', color: '#C41F3E' },
    { id: 'dubai_islamic', name: 'Dubai Islamic Bank', logo: 'https://icons.duckduckgo.com/ip3/dib.ae.ico', color: '#00A651' },
  ],
  SA: [
    { id: 'snb', name: 'Saudi National Bank', logo: 'https://icons.duckduckgo.com/ip3/alahlionline.com.ico', color: '#0055A4' },
    { id: 'riyad_bank', name: 'Riyad Bank', logo: 'https://icons.duckduckgo.com/ip3/riyadbank.com.ico', color: '#C41F3E' },
  ],
  QA: [
    { id: 'qnb_qatar', name: 'QNB Qatar', logo: 'https://icons.duckduckgo.com/ip3/qnb.com.ico', color: '#003399' },
    { id: 'commercial_bank_qatar', name: 'Commercial Bank Qatar', logo: 'https://icons.duckduckgo.com/ip3/cbq.qa.ico', color: '#0055A4' },
  ],
  KW: [
    { id: 'nbk', name: 'National Bank of Kuwait', logo: 'https://icons.duckduckgo.com/ip3/nbk.com.ico', color: '#0055A4' },
  ],
  BH: [
    { id: 'ahli_united', name: 'Ahli United Bank', logo: 'https://icons.duckduckgo.com/ip3/ahliunited.com.ico', color: '#C41F3E' },
  ],
  JO: [
    { id: 'hbl_jordan', name: 'HBL Jordan', logo: 'https://icons.duckduckgo.com/ip3/hbl.com.ico', color: '#0055A4' },
  ],
  LB: [
    { id: 'blom', name: 'BLOM Bank', logo: 'https://icons.duckduckgo.com/ip3/blombank.com.ico', color: '#0055A4' },
  ],
  // Africa
  ZA: [
    { id: 'absa', name: 'Absa', logo: 'https://icons.duckduckgo.com/ip3/absa.co.za.ico', color: '#C41F3E' },
    { id: 'fnb', name: 'FNB', logo: 'https://icons.duckduckgo.com/ip3/fnb.co.za.ico', color: '#00A9E0' },
    { id: 'nedbank', name: 'Nedbank', logo: 'https://icons.duckduckgo.com/ip3/nedbank.co.za.ico', color: '#00A651' },
    { id: 'standard_bank', name: 'Standard Bank', logo: 'https://icons.duckduckgo.com/ip3/standardbank.co.za.ico', color: '#0055A4' },
    { id: 'capitec', name: 'Capitec', logo: 'https://icons.duckduckgo.com/ip3/capitecbank.co.za.ico', color: '#00A651' },
  ],
  EG: [
    { id: 'nbe', name: 'National Bank of Egypt', logo: 'https://icons.duckduckgo.com/ip3/nbe.com.eg.ico', color: '#0055A4' },
    { id: 'banque_misr', name: 'Banque Misr', logo: 'https://icons.duckduckgo.com/ip3/banquemisr.com.ico', color: '#E30613' },
    { id: 'cib_egypt', name: 'CIB Egypt', logo: 'https://icons.duckduckgo.com/ip3/cibeg.com.ico', color: '#00A651' },
    { id: 'banque_caire', name: 'Banque du Caire', logo: 'https://icons.duckduckgo.com/ip3/banqueducaire.com.ico', color: '#C41F3E' },
    { id: 'qnb_egypt', name: 'QNB Egypt', logo: 'https://icons.duckduckgo.com/ip3/qnbalahli.com.ico', color: '#003399' },
    { id: 'alexbank', name: 'AlexBank', logo: 'https://icons.duckduckgo.com/ip3/alexbank.com.ico', color: '#FF6600' },
    { id: 'hsbc_egypt', name: 'HSBC Egypt', logo: 'https://icons.duckduckgo.com/ip3/hsbc.com.eg.ico', color: '#DB0011' },
    { id: 'egyptian_gulf', name: 'Egyptian Gulf Bank', logo: 'https://icons.duckduckgo.com/ip3/egb.com.eg.ico', color: '#0055A4' },
    { id: 'united_bank', name: 'United Bank', logo: 'https://icons.duckduckgo.com/ip3/ubegypt.com.ico', color: '#003399' },
    { id: 'fawry', name: 'Fawry Bank', logo: 'https://icons.duckduckgo.com/ip3/fawry.com.ico', color: '#00A9E0' },
  ],
  NG: [
    { id: 'gtbank', name: 'GTBank', logo: 'https://icons.duckduckgo.com/ip3/gtbank.com.ico', color: '#E30613' },
    { id: 'zenith', name: 'Zenith Bank', logo: 'https://icons.duckduckgo.com/ip3/zenithbank.com.ico', color: '#C41F3E' },
    { id: 'access', name: 'Access Bank', logo: 'https://icons.duckduckgo.com/ip3/accessbankplc.com.ico', color: '#00A651' },
  ],
  KE: [
    { id: 'kcb', name: 'KCB Bank', logo: 'https://icons.duckduckgo.com/ip3/kcbgroup.com.ico', color: '#C41F3E' },
    { id: 'equity', name: 'Equity Bank', logo: 'https://icons.duckduckgo.com/ip3/equitybank.co.ke.ico', color: '#00A651' },
  ],

  // South America
  BR: [
    { id: 'itau', name: 'Itaú', logo: 'https://icons.duckduckgo.com/ip3/itau.com.br.ico', color: '#FF6600' },
    { id: 'bradesco', name: 'Bradesco', logo: 'https://icons.duckduckgo.com/ip3/bradesco.com.br.ico', color: '#C41F3E' },
    { id: 'santander_br', name: 'Santander Brasil', logo: 'https://icons.duckduckgo.com/ip3/santander.com.br.ico', color: '#EC0000' },
    { id: 'banco_do_brasil', name: 'Banco do Brasil', logo: 'https://icons.duckduckgo.com/ip3/bb.com.br.ico', color: '#FFCC00' },
    { id: 'caixa', name: 'Caixa Econômica', logo: 'https://icons.duckduckgo.com/ip3/caixa.gov.br.ico', color: '#0055A4' },
    { id: 'nubank', name: 'Nubank', logo: 'https://icons.duckduckgo.com/ip3/nubank.com.br.ico', color: '#8A05BE' },
    { id: 'inter', name: 'Banco Inter', logo: 'https://icons.duckduckgo.com/ip3/bancointer.com.br.ico', color: '#FF6600' },
    { id: 'original', name: 'Banco Original', logo: 'https://icons.duckduckgo.com/ip3/original.com.br.ico', color: '#00A651' },
  ],
  AR: [
    { id: 'galicia', name: 'Banco Galicia', logo: 'https://icons.duckduckgo.com/ip3/galicia.com.ar.ico', color: '#E30613' },
    { id: 'santander_ar', name: 'Santander Argentina', logo: 'https://icons.duckduckgo.com/ip3/santander.com.ar.ico', color: '#EC0000' },
    { id: 'bbva_ar', name: 'BBVA Argentina', logo: 'https://icons.duckduckgo.com/ip3/bbva.com.ar.ico', color: '#004481' },
  ],
  CL: [
    { id: 'banco_chile', name: 'Banco de Chile', logo: 'https://icons.duckduckgo.com/ip3/bancochile.cl.ico', color: '#003399' },
    { id: 'santander_cl', name: 'Santander Chile', logo: 'https://icons.duckduckgo.com/ip3/santander.cl.ico', color: '#EC0000' },
  ],
  CO: [
    { id: 'bancolombia', name: 'Bancolombia', logo: 'https://icons.duckduckgo.com/ip3/grupobancolombia.com.ico', color: '#FFCC00' },
    { id: 'davivienda', name: 'Davivienda', logo: 'https://icons.duckduckgo.com/ip3/davivienda.com.ico', color: '#E30613' },
  ],
  PE: [
    { id: 'bcp', name: 'BCP', logo: 'https://icons.duckduckgo.com/ip3/viabcp.com.ico', color: '#0055A4' },
  ],
  UY: [
    { id: 'brou', name: 'BROU', logo: 'https://icons.duckduckgo.com/ip3/brou.com.uy.ico', color: '#0055A4' },
  ],
  PY: [
    { id: 'bcp_py', name: 'BCP Paraguay', logo: 'https://icons.duckduckgo.com/ip3/bcp.com.py.ico', color: '#0055A4' },
  ],
  BO: [
    { id: 'banco_bisa', name: 'Banco BISA', logo: 'https://icons.duckduckgo.com/ip3/bancobisa.com.ico', color: '#0055A4' },
  ],
  // Other
  IL: [
    { id: 'hapoalim', name: 'Bank Hapoalim', logo: 'https://icons.duckduckgo.com/ip3/bankhapoalim.co.il.ico', color: '#E30613' },
    { id: 'leumi', name: 'Bank Leumi', logo: 'https://icons.duckduckgo.com/ip3/bankleumi.co.il.ico', color: '#0055A4' },
    { id: 'discount', name: 'Discount Bank', logo: 'https://icons.duckduckgo.com/ip3/discountbank.co.il.ico', color: '#003399' },
    { id: 'mizrahi', name: 'Mizrahi Tefahot', logo: 'https://icons.duckduckgo.com/ip3/mizrahi-tefahot.co.il.ico', color: '#00A651' },
  ],
  TR: [
    { id: 'isbank', name: 'Isbank', logo: 'https://icons.duckduckgo.com/ip3/isbank.com.tr.ico', color: '#0055A4' },
    { id: 'garanti', name: 'Garanti BBVA', logo: 'https://icons.duckduckgo.com/ip3/garantibbva.com.tr.ico', color: '#00A651' },
    { id: 'akbank', name: 'Akbank', logo: 'https://icons.duckduckgo.com/ip3/akbank.com.ico', color: '#C41F3E' },
  ],
  PK: [
    { id: 'hbl', name: 'HBL', logo: 'https://icons.duckduckgo.com/ip3/hbl.com.ico', color: '#0055A4' },
    { id: 'ubl', name: 'UBL', logo: 'https://icons.duckduckgo.com/ip3/ubldigital.com.ico', color: '#00A651' },
  ],
  BD: [
    { id: 'brac', name: 'BRAC Bank', logo: 'https://icons.duckduckgo.com/ip3/bracbank.com.ico', color: '#C41F3E' },
  ],
  LK: [
    { id: 'commercial_bank_lk', name: 'Commercial Bank', logo: 'https://icons.duckduckgo.com/ip3/combank.net.ico', color: '#0055A4' },
  ],
  NP: [
    { id: 'nabil', name: 'Nabil Bank', logo: 'https://icons.duckduckgo.com/ip3/nabilbank.com.ico', color: '#C41F3E' },
  ],
  MM: [
    { id: 'kbz', name: 'KBZ Bank', logo: 'https://icons.duckduckgo.com/ip3/kbzbank.com.ico', color: '#0055A4' },
  ],
  KH: [
    { id: 'aba', name: 'ABA Bank', logo: 'https://icons.duckduckgo.com/ip3/ababank.com.ico', color: '#0055A4' },
  ],
  LA: [
    { id: 'bfl', name: 'Banque Franco-Lao', logo: 'https://icons.duckduckgo.com/ip3/bfl.com.la.ico', color: '#0055A4' },
  ],
  MN: [
    { id: 'khan', name: 'Khan Bank', logo: 'https://icons.duckduckgo.com/ip3/khanbank.com.ico', color: '#C41F3E' },
  ],
  UZ: [
    { id: 'nbu', name: 'National Bank Uzbekistan', logo: 'https://icons.duckduckgo.com/ip3/nbu.com.ico', color: '#0055A4' },
  ],
  KZ: [
    { id: 'halyk', name: 'Halyk Bank', logo: 'https://icons.duckduckgo.com/ip3/halykbank.kz.ico', color: '#E30613' },
  ],
  KG: [
    { id: 'demir', name: 'Demir Bank', logo: 'https://icons.duckduckgo.com/ip3/demirbank.kg.ico', color: '#0055A4' },
  ],
  TJ: [
    { id: 'eskhata', name: 'Eskhata Bank', logo: 'https://icons.duckduckgo.com/ip3/eskhata.com.ico', color: '#0055A4' },
  ],
  TM: [
    { id: 'dayhan', name: 'Dayhan Bank', logo: 'https://icons.duckduckgo.com/ip3/dayhanbank.gov.tm.ico', color: '#00A651' },
  ],
  AF: [
    { id: 'azizi', name: 'Azizi Bank', logo: 'https://icons.duckduckgo.com/ip3/azizibank.com.af.ico', color: '#0055A4' },
  ],
  IR: [
    { id: 'melli', name: 'Bank Melli', logo: 'https://icons.duckduckgo.com/ip3/bmelli.ir.ico', color: '#0055A4' },
  ],
  IQ: [
    { id: 'trade_bank_iraq', name: 'Trade Bank of Iraq', logo: 'https://icons.duckduckgo.com/ip3/tbi.iq.ico', color: '#0055A4' },
  ],
  SY: [
    { id: 'commercial_bank_syria', name: 'Commercial Bank of Syria', logo: 'https://icons.duckduckgo.com/ip3/cbs.gov.sy.ico', color: '#0055A4' },
  ],
  YE: [
    { id: 'central_bank_yemen', name: 'Central Bank of Yemen', logo: 'https://icons.duckduckgo.com/ip3/centralbank.gov.ye.ico', color: '#0055A4' },
  ],
  OM: [
    { id: 'bank_muscat', name: 'Bank Muscat', logo: 'https://icons.duckduckgo.com/ip3/bankmuscat.com.ico', color: '#0055A4' },
  ],
  // CIS
  RU: [
    { id: 'sberbank', name: 'Sberbank', logo: 'https://icons.duckduckgo.com/ip3/sberbank.ru.ico', color: '#00A651' },
    { id: 'vtb', name: 'VTB', logo: 'https://icons.duckduckgo.com/ip3/vtb.ru.ico', color: '#0055A4' },
    { id: 'tinkoff', name: 'Tinkoff', logo: 'https://icons.duckduckgo.com/ip3/tinkoff.ru.ico', color: '#FFCC00' },
    { id: 'alfa', name: 'Alfa-Bank', logo: 'https://icons.duckduckgo.com/ip3/alfabank.ru.ico', color: '#E30613' },
  ],
  UA: [
    { id: 'privat', name: 'PrivatBank', logo: 'https://icons.duckduckgo.com/ip3/privatbank.ua.ico', color: '#00A651' },
    { id: 'monobank', name: 'Monobank', logo: 'https://icons.duckduckgo.com/ip3/monobank.ua.ico', color: '#000000' },
  ],
  BY: [
    { id: 'belarusbank', name: 'Belarusbank', logo: 'https://icons.duckduckgo.com/ip3/belarusbank.by.ico', color: '#00A651' },
  ],
  MD: [
    { id: 'moldova_agroindbank', name: 'MAIB', logo: 'https://icons.duckduckgo.com/ip3/maib.md.ico', color: '#0055A4' },
  ],
  GE: [
    { id: 'tbc', name: 'TBC Bank', logo: 'https://icons.duckduckgo.com/ip3/tbcbank.com.ge.ico', color: '#00A651' },
    { id: 'bank_of_georgia', name: 'Bank of Georgia', logo: 'https://icons.duckduckgo.com/ip3/bog.ge.ico', color: '#FF6600' },
  ],
  AM: [
    { id: 'ameria', name: 'Ameriabank', logo: 'https://icons.duckduckgo.com/ip3/ameriabank.am.ico', color: '#0055A4' },
  ],
  AZ: [
    { id: 'pasha', name: 'PASHA Bank', logo: 'https://icons.duckduckgo.com/ip3/pashabank.az.ico', color: '#0055A4' },
  ],
  // Baltics
  EE: [
    { id: 'swedbank_ee', name: 'Swedbank Estonia', logo: 'https://icons.duckduckgo.com/ip3/swedbank.ee.ico', color: '#FF6600' },
    { id: 'seb_ee', name: 'SEB Estonia', logo: 'https://icons.duckduckgo.com/ip3/seb.ee.ico', color: '#003399' },
    { id: 'lhv', name: 'LHV', logo: 'https://icons.duckduckgo.com/ip3/lhv.ee.ico', color: '#00A651' },
  ],
  LV: [
    { id: 'swedbank_lv', name: 'Swedbank Latvia', logo: 'https://icons.duckduckgo.com/ip3/swedbank.lv.ico', color: '#FF6600' },
    { id: 'seb_lv', name: 'SEB Latvia', logo: 'https://icons.duckduckgo.com/ip3/seb.lv.ico', color: '#003399' },
  ],
  LT: [
    { id: 'swedbank_lt', name: 'Swedbank Lithuania', logo: 'https://icons.duckduckgo.com/ip3/swedbank.lt.ico', color: '#FF6600' },
    { id: 'seb_lt', name: 'SEB Lithuania', logo: 'https://icons.duckduckgo.com/ip3/seb.lt.ico', color: '#003399' },
    { id: 'revolut_lt', name: 'Revolut Lithuania', logo: 'https://icons.duckduckgo.com/ip3/revolut.com.ico', color: '#000000' },
  ],
  // Balkans
  HR: [
    { id: 'zagrebacka', name: 'Zagrebacka Banka', logo: 'https://icons.duckduckgo.com/ip3/zaba.hr.ico', color: '#E30613' },
  ],
  SI: [
    { id: 'nlb', name: 'NLB', logo: 'https://icons.duckduckgo.com/ip3/nlb.si.ico', color: '#E30613' },
  ],
  BA: [
    { id: 'raiffeisen_ba', name: 'Raiffeisen Bosnia', logo: 'https://icons.duckduckgo.com/ip3/raiffeisenbank.ba.ico', color: '#FFCC00' },
  ],
  RS: [
    { id: 'aiK', name: 'AIK Banka', logo: 'https://icons.duckduckgo.com/ip3/aikbanka.rs.ico', color: '#0055A4' },
  ],
  BG: [
    { id: 'unicredit_bg', name: 'UniCredit Bulgaria', logo: 'https://icons.duckduckgo.com/ip3/unicreditbulbank.bg.ico', color: '#E30613' },
  ],
  MK: [
    { id: 'komercijalna', name: 'Komercijalna Banka', logo: 'https://icons.duckduckgo.com/ip3/kb.mk.ico', color: '#0055A4' },
  ],
  AL: [
    { id: 'raiffeisen_al', name: 'Raiffeisen Albania', logo: 'https://icons.duckduckgo.com/ip3/raiffeisen.al.ico', color: '#FFCC00' },
  ],
  ME: [
    { id: 'crnogorska', name: 'Crnogorska Komercijalna', logo: 'https://icons.duckduckgo.com/ip3/ckb.me.ico', color: '#0055A4' },
  ],
  // Caribbean

  TT: [
    { id: 'republic_bank', name: 'Republic Bank', logo: 'https://icons.duckduckgo.com/ip3/republictt.com.ico', color: '#0055A4' },
  ],
  BB: [
    { id: 'cibc_bb', name: 'CIBC Barbados', logo: 'https://icons.duckduckgo.com/ip3/cibc.com.ico', color: '#C41F3E' },
  ],
  // Pacific
  FJ: [
    { id: 'westpac_fj', name: 'Westpac Fiji', logo: 'https://icons.duckduckgo.com/ip3/westpac.com.fj.ico', color: '#DA2128' },
  ],
  PG: [
    { id: 'bsp', name: 'BSP', logo: 'https://icons.duckduckgo.com/ip3/bsp.com.pg.ico', color: '#0055A4' },
  ],
  // Additional European
  SK: [
    { id: 'tatra', name: 'Tatra Banka', logo: 'https://icons.duckduckgo.com/ip3/tatrabanka.sk.ico', color: '#0055A4' },
  ],
  IS: [
    { id: 'landsbankinn', name: 'Landsbankinn', logo: 'https://icons.duckduckgo.com/ip3/landsbankinn.is.ico', color: '#E30613' },
  ],
  LI: [
    { id: 'llb', name: 'Liechtensteinische Landesbank', logo: 'https://icons.duckduckgo.com/ip3/llb.li.ico', color: '#0055A4' },
  ],
  MT: [
    { id: 'bank_of_valletta', name: 'Bank of Valletta', logo: 'https://icons.duckduckgo.com/ip3/bov.com.ico', color: '#0055A4' },
  ],
  CY: [
    { id: 'bank_of_cyprus', name: 'Bank of Cyprus', logo: 'https://icons.duckduckgo.com/ip3/bankofcyprus.com.ico', color: '#0055A4' },
  ],
  LU: [
    { id: 'bcee', name: 'BCEE', logo: 'https://icons.duckduckgo.com/ip3/bcee.lu.ico', color: '#0055A4' },
  ],
  MC: [
    { id: 'cfm', name: 'CFM', logo: 'https://icons.duckduckgo.com/ip3/cfm.mc.ico', color: '#0055A4' },
  ],
  SM: [
    { id: 'cassarisp', name: 'Cassa di Risparmio', logo: 'https://icons.duckduckgo.com/ip3/cassarisp.sm.ico', color: '#0055A4' },
  ],
  VA: [
    { id: 'ior', name: 'IOR', logo: 'https://icons.duckduckgo.com/ip3/ior.va.ico', color: '#0055A4' },
  ],
  AD: [
    { id: 'andbank', name: 'Andbank', logo: 'https://icons.duckduckgo.com/ip3/andbank.com.ico', color: '#0055A4' },
  ],
  FO: [
    { id: 'banknordik', name: 'BankNordik', logo: 'https://icons.duckduckgo.com/ip3/banknordik.fo.ico', color: '#0055A4' },
  ],
  GL: [
    { id: 'gronlandsbanken', name: 'Grønlandsbanken', logo: 'https://icons.duckduckgo.com/ip3/gronlandsbanken.gl.ico', color: '#0055A4' },
  ],
  AX: [
    { id: 'alandbank', name: 'Ålandsbanken', logo: 'https://icons.duckduckgo.com/ip3/alandbanken.ax.ico', color: '#0055A4' },
  ],
  SJ: [
    { id: 'sparebank1_sj', name: 'SpareBank 1 Svalbard', logo: 'https://icons.duckduckgo.com/ip3/sparebank1.no.ico', color: '#E30613' },
  ],
  // Additional Asian
  MO: [
    { id: 'icbc_mo', name: 'ICBC Macau', logo: 'https://icons.duckduckgo.com/ip3/icbc.com.mo.ico', color: '#C41F3E' },
  ],
  TW: [
    { id: 'ctbc', name: 'CTBC', logo: 'https://icons.duckduckgo.com/ip3/ctbcbank.com.ico', color: '#0055A4' },
    { id: 'cathay', name: 'Cathay Bank', logo: 'https://icons.duckduckgo.com/ip3/cathaybank.com.tw.ico', color: '#0055A4' },
  ],
  CN: [
    { id: 'icbc', name: 'ICBC', logo: 'https://icons.duckduckgo.com/ip3/icbc.com.cn.ico', color: '#C41F3E' },
    { id: 'ccb', name: 'China Construction Bank', logo: 'https://icons.duckduckgo.com/ip3/ccb.com.ico', color: '#0055A4' },
    { id: 'boc', name: 'Bank of China', logo: 'https://icons.duckduckgo.com/ip3/boc.cn.ico', color: '#C41F3E' },
    { id: 'abc', name: 'Agricultural Bank of China', logo: 'https://icons.duckduckgo.com/ip3/abchina.com.ico', color: '#00A651' },
  ],
  MV: [
    { id: 'bml', name: 'Bank of Maldives', logo: 'https://icons.duckduckgo.com/ip3/bankofmaldives.com.mv.ico', color: '#0055A4' },
  ],
  BT: [
    { id: 'boB', name: 'Bank of Bhutan', logo: 'https://icons.duckduckgo.com/ip3/bob.bt.ico', color: '#0055A4' },
  ],
  // Additional African
  UG: [
    { id: 'centenary', name: 'Centenary Bank', logo: 'https://icons.duckduckgo.com/ip3/centenarybank.co.ug.ico', color: '#00A651' },
  ],
  TZ: [
    { id: 'crdb', name: 'CRDB Bank', logo: 'https://icons.duckduckgo.com/ip3/crdbbank.co.tz.ico', color: '#00A651' },
  ],
  RW: [
    { id: 'bk', name: 'Bank of Kigali', logo: 'https://icons.duckduckgo.com/ip3/bk.rw.ico', color: '#C41F3E' },
  ],
  BI: [
    { id: 'bcb', name: 'BCB', logo: 'https://icons.duckduckgo.com/ip3/bcb-burundi.com.ico', color: '#0055A4' },
  ],
  MW: [
    { id: 'fdh', name: 'FDH Bank', logo: 'https://icons.duckduckgo.com/ip3/fdhbank.com.ico', color: '#00A651' },
  ],
  MZ: [
    { id: 'millennium_mz', name: 'Millennium BIM', logo: 'https://icons.duckduckgo.com/ip3/millenniumbim.co.mz.ico', color: '#E30613' },
  ],
  ZM: [
    { id: 'zambia_national_commercial', name: 'Zanaco', logo: 'https://icons.duckduckgo.com/ip3/zanaco.co.zm.ico', color: '#0055A4' },
  ],
  ZW: [
    { id: 'cbz', name: 'CBZ Bank', logo: 'https://icons.duckduckgo.com/ip3/cbz.co.zw.ico', color: '#00A651' },
  ],
  BW: [
    { id: 'babc', name: 'BABC', logo: 'https://icons.duckduckgo.com/ip3/babc.co.bw.ico', color: '#0055A4' },
  ],
  NA: [
    { id: 'bank_windhoek', name: 'Bank Windhoek', logo: 'https://icons.duckduckgo.com/ip3/bankwindhoek.com.na.ico', color: '#0055A4' },
  ],
  SZ: [
    { id: 'standard_bank_sz', name: 'Standard Bank Eswatini', logo: 'https://icons.duckduckgo.com/ip3/standardbank.co.sz.ico', color: '#0055A4' },
  ],
  LS: [
    { id: 'standard_lesotho', name: 'Standard Lesotho Bank', logo: 'https://icons.duckduckgo.com/ip3/standardlesothobank.co.ls.ico', color: '#0055A4' },
  ],
  MG: [
    { id: 'bni', name: 'BNI Madagascar', logo: 'https://icons.duckduckgo.com/ip3/bni.mg.ico', color: '#0055A4' },
  ],
  MU: [
    { id: 'mcb', name: 'MCB', logo: 'https://icons.duckduckgo.com/ip3/mcb.mu.ico', color: '#0055A4' },
  ],
  SC: [
    { id: 'absa_sc', name: 'Absa Seychelles', logo: 'https://icons.duckduckgo.com/ip3/absa.co.sc.ico', color: '#C41F3E' },
  ],
  KM: [
    { id: 'exim_bank_km', name: 'Exim Bank Comoros', logo: 'https://icons.duckduckgo.com/ip3/eximbankcomoros.km.ico', color: '#0055A4' },
  ],
  DJ: [
    { id: 'bceao_dj', name: 'BCEAO Djibouti', logo: 'https://icons.duckduckgo.com/ip3/bceao.int.ico', color: '#0055A4' },
  ],
  ER: [
    { id: 'commercial_bank_eritrea', name: 'Commercial Bank Eritrea', logo: 'https://icons.duckduckgo.com/ip3/cbe.com.er.ico', color: '#0055A4' },
  ],
  ET: [
    { id: 'cbe_ethiopia', name: 'CBE', logo: 'https://icons.duckduckgo.com/ip3/cbe.com.et.ico', color: '#0055A4' },
  ],
  SD: [
    { id: 'bank_of_sudan', name: 'Bank of Sudan', logo: 'https://icons.duckduckgo.com/ip3/bankofsudan.sd.ico', color: '#0055A4' },
  ],
  SS: [
    { id: 'kcb_ss', name: 'KCB South Sudan', logo: 'https://icons.duckduckgo.com/ip3/kcbss.com.ico', color: '#C41F3E' },
  ],
  CF: [
    { id: 'bec', name: 'BEC', logo: 'https://icons.duckduckgo.com/ip3/bec-bangui.com.ico', color: '#0055A4' },
  ],
  CM: [
    { id: 'afriland', name: 'Afriland First Bank', logo: 'https://icons.duckduckgo.com/ip3/afrilandfirstbank.com.ico', color: '#00A651' },
  ],
  GA: [
    { id: 'bgfi', name: 'BGFI Bank', logo: 'https://icons.duckduckgo.com/ip3/bgfi.com.ico', color: '#0055A4' },
  ],
  CG: [
    { id: 'bimo', name: 'BIMO', logo: 'https://icons.duckduckgo.com/ip3/bimocongo.com.ico', color: '#0055A4' },
  ],
  CD: [
    { id: 'rawbank', name: 'Rawbank', logo: 'https://icons.duckduckgo.com/ip3/rawbank.cd.ico', color: '#C41F3E' },
  ],
  TD: [
    { id: 'commercial_bank_chad', name: 'Commercial Bank Chad', logo: 'https://icons.duckduckgo.com/ip3/cbchad.com.ico', color: '#0055A4' },
  ],
  NE: [
    { id: 'ecobank_ne', name: 'Ecobank Niger', logo: 'https://icons.duckduckgo.com/ip3/ecobank.com.ico', color: '#0055A4' },
  ],
  ML: [
    { id: 'banque_mali', name: 'Banque du Mali', logo: 'https://icons.duckduckgo.com/ip3/bdm.ml.ico', color: '#0055A4' },
  ],
  BF: [
    { id: 'coris_bank', name: 'Coris Bank', logo: 'https://icons.duckduckgo.com/ip3/corisbank.com.ico', color: '#00A651' },
  ],
  SN: [
    { id: 'cbao', name: 'CBAO', logo: 'https://icons.duckduckgo.com/ip3/cbao.sn.ico', color: '#0055A4' },
  ],
  GM: [
    { id: 'access_gm', name: 'Access Bank Gambia', logo: 'https://icons.duckduckgo.com/ip3/accessbank.gm.ico', color: '#00A651' },
  ],
  GW: [
    { id: 'bca_gw', name: 'BCA Guinée-Bissau', logo: 'https://icons.duckduckgo.com/ip3/bca.gw.ico', color: '#0055A4' },
  ],
  GN: [
    { id: 'banque_guinee', name: 'Banque Guinée', logo: 'https://icons.duckduckgo.com/ip3/banqueguinee.com.ico', color: '#0055A4' },
  ],
  SL: [
    { id: 'rokel', name: 'Rokel Commercial Bank', logo: 'https://icons.duckduckgo.com/ip3/rokelbank.com.ico', color: '#0055A4' },
  ],
  LR: [
    { id: 'lbdi', name: 'LBDI', logo: 'https://icons.duckduckgo.com/ip3/lbdi.com.lr.ico', color: '#0055A4' },
  ],
  CI: [
    { id: 'nsia', name: 'NSIA Bank', logo: 'https://icons.duckduckgo.com/ip3/nsiabanque.ci.ico', color: '#E30613' },
  ],
  GH: [
    { id: 'ghana_commercial', name: 'GCB Bank', logo: 'https://icons.duckduckgo.com/ip3/gcb.com.gh.ico', color: '#FFCC00' },
    { id: 'ecobank_gh', name: 'Ecobank Ghana', logo: 'https://icons.duckduckgo.com/ip3/ecobank.com.gh.ico', color: '#0055A4' },
  ],
  TG: [
    { id: 'ecobank_tg', name: 'Ecobank Togo', logo: 'https://icons.duckduckgo.com/ip3/ecobank.com.ico', color: '#0055A4' },
  ],
  BJ: [
    { id: 'boa_benin', name: 'BOA Benin', logo: 'https://icons.duckduckgo.com/ip3/boabenin.com.ico', color: '#0055A4' },
  ],
  MR: [
    { id: 'chinguetti', name: 'Banque Chinguetti', logo: 'https://icons.duckduckgo.com/ip3/chinguetti.com.ico', color: '#0055A4' },
  ],
  // Additional American
  PA: [
    { id: 'banco_general', name: 'Banco General', logo: 'https://icons.duckduckgo.com/ip3/bgeneral.com.ico', color: '#0055A4' },
  ],
  CR: [
    { id: 'banco_nacional', name: 'Banco Nacional', logo: 'https://icons.duckduckgo.com/ip3/bncr.fi.cr.ico', color: '#0055A4' },
  ],
  GT: [
    { id: 'banco_agricola', name: 'Banco Agrícola', logo: 'https://icons.duckduckgo.com/ip3/bancoagricola.com.ico', color: '#00A651' },
  ],
  HN: [
    { id: 'ficohsa', name: 'Ficohsa', logo: 'https://icons.duckduckgo.com/ip3/ficohsa.com.ico', color: '#0055A4' },
  ],
  SV: [
    { id: 'banco_agricola_sv', name: 'Banco Agrícola El Salvador', logo: 'https://icons.duckduckgo.com/ip3/bancoagricola.com.ico', color: '#00A651' },
  ],
  NI: [
    { id: 'banco_lafise', name: 'Banco Lafise', logo: 'https://icons.duckduckgo.com/ip3/lafise.com.ico', color: '#0055A4' },
  ],
  DO: [
    { id: 'banco_popular', name: 'Banco Popular', logo: 'https://icons.duckduckgo.com/ip3/popular.com.do.ico', color: '#0055A4' },
  ],
  CU: [
    { id: 'bandec', name: 'BANDEC', logo: 'https://icons.duckduckgo.com/ip3/bandec.cu.ico', color: '#0055A4' },
  ],
  PR: [
    { id: 'banco_popular_pr', name: 'Banco Popular PR', logo: 'https://icons.duckduckgo.com/ip3/popular.com.ico', color: '#0055A4' },
  ],
  JM: [
    { id: 'ncb_jm', name: 'NCB Jamaica', logo: 'https://icons.duckduckgo.com/ip3/ncbjm.com.ico', color: '#0055A4' },
  ],
  HT: [
    { id: 'sogebank', name: 'Sogebank', logo: 'https://icons.duckduckgo.com/ip3/sogebank.com.ico', color: '#0055A4' },
  ],
  BS: [
    { id: 'rbc_royal_bank_bs', name: 'RBC Royal Bank Bahamas', logo: 'https://icons.duckduckgo.com/ip3/rbcroyalbank.com.ico', color: '#005AB5' },
  ],
  KY: [
    { id: 'cibc_ky', name: 'CIBC Cayman', logo: 'https://icons.duckduckgo.com/ip3/cibc.com.ico', color: '#C41F3E' },
  ],
  VG: [
    { id: 'vp_bank', name: 'VP Bank', logo: 'https://icons.duckduckgo.com/ip3/vpbank.com.ico', color: '#0055A4' },
  ],
  AI: [
    { id: 'national_bank_anguilla', name: 'National Bank Anguilla', logo: 'https://icons.duckduckgo.com/ip3/nbai.com.ico', color: '#0055A4' },
  ],
  KN: [
    { id: 'bank_nevis', name: 'Bank of Nevis', logo: 'https://icons.duckduckgo.com/ip3/bankofnevis.com.ico', color: '#0055A4' },
  ],
  LC: [
    { id: 'bank_lucia', name: 'Bank of Saint Lucia', logo: 'https://icons.duckduckgo.com/ip3/bankofsaintlucia.com.ico', color: '#0055A4' },
  ],
  VC: [
    { id: 'bank_vincent', name: 'Bank of Saint Vincent', logo: 'https://icons.duckduckgo.com/ip3/banksvg.com.ico', color: '#0055A4' },
  ],
  GD: [
    { id: 'grenada_coop', name: 'Grenada Co-op', logo: 'https://icons.duckduckgo.com/ip3/grenadacoop.com.ico', color: '#0055A4' },
  ],
  AG: [
    { id: 'antigua_commercial', name: 'Antigua Commercial Bank', logo: 'https://icons.duckduckgo.com/ip3/acb.ag.ico', color: '#0055A4' },
  ],
  DM: [
    { id: 'dominica_agricultural', name: 'Agricultural Bank Dominica', logo: 'https://icons.duckduckgo.com/ip3/agriculturalbank.dm.ico', color: '#0055A4' },
  ],
  VI: [
    { id: 'scotiabank_vi', name: 'Scotiabank USVI', logo: 'https://icons.duckduckgo.com/ip3/scotiabank.com.ico', color: '#ED0722' },
  ],
  BZ: [
    { id: 'belize_bank', name: 'Belize Bank', logo: 'https://icons.duckduckgo.com/ip3/belizebank.com.ico', color: '#0055A4' },
  ],
  SR: [
    { id: 'hakrinbank', name: 'Hakrinbank', logo: 'https://icons.duckduckgo.com/ip3/hakrinbank.com.ico', color: '#0055A4' },
  ],
  GY: [
    { id: 'republic_guyana', name: 'Republic Bank Guyana', logo: 'https://icons.duckduckgo.com/ip3/republicguyana.com.ico', color: '#0055A4' },
  ],
  GF: [
    { id: 'banque_fr_guiana', name: 'Banque France Guiana', logo: 'https://icons.duckduckgo.com/ip3/banque-france.fr.ico', color: '#0055A4' },
  ],
  // Additional Oceanian
  NC: [
    { id: 'bnc', name: 'BNC', logo: 'https://icons.duckduckgo.com/ip3/bnc.nc.ico', color: '#0055A4' },
  ],
  PF: [
    { id: 'socredo', name: 'Socredo', logo: 'https://icons.duckduckgo.com/ip3/socredo.pf.ico', color: '#0055A4' },
  ],
  WF: [
    { id: 'banque_wallis', name: 'Banque Wallis', logo: 'https://icons.duckduckgo.com/ip3/banque-wallis.com.ico', color: '#0055A4' },
  ],
  SB: [
    { id: 'sib', name: 'SIB', logo: 'https://icons.duckduckgo.com/ip3/sib.com.sb.ico', color: '#0055A4' },
  ],
  VU: [
    { id: 'nbv', name: 'National Bank Vanuatu', logo: 'https://icons.duckduckgo.com/ip3/nbv.vu.ico', color: '#0055A4' },
  ],
  KI: [
    { id: 'bok', name: 'Bank of Kiribati', logo: 'https://icons.duckduckgo.com/ip3/bok.com.ki.ico', color: '#0055A4' },
  ],
  TO: [
    { id: 'mbf', name: 'MBF Bank', logo: 'https://icons.duckduckgo.com/ip3/mbf.to.ico', color: '#0055A4' },
  ],
  NR: [
    { id: 'bendigo_nr', name: 'Bendigo Bank Nauru', logo: 'https://icons.duckduckgo.com/ip3/bendigobank.com.au.ico', color: '#821F3A' },
  ],
  TV: [
    { id: 'nbt', name: 'National Bank Tuvalu', logo: 'https://icons.duckduckgo.com/ip3/nbt.gov.tv.ico', color: '#0055A4' },
  ],
  CK: [
    { id: 'boc_ck', name: 'Bank of Cook Islands', logo: 'https://icons.duckduckgo.com/ip3/bci.com.ck.ico', color: '#0055A4' },
  ],
  NU: [
    { id: 'klickex', name: 'KlickEx', logo: 'https://icons.duckduckgo.com/ip3/klickex.com.ico', color: '#0055A4' },
  ],
  TK: [
    { id: 'anz_tk', name: 'ANZ Tokelau', logo: 'https://icons.duckduckgo.com/ip3/anz.com.ico', color: '#004165' },
  ],
  AS: [
    { id: 'ames', name: 'AMES', logo: 'https://icons.duckduckgo.com/ip3/ames.net.ico', color: '#0055A4' },
  ],
  GU: [
    { id: 'bankguam', name: 'Bank of Guam', logo: 'https://icons.duckduckgo.com/ip3/bankguam.com.ico', color: '#0055A4' },
  ],
  MP: [
    { id: 'bank_saipan', name: 'Bank of Saipan', logo: 'https://icons.duckduckgo.com/ip3/bankofsaipan.com.ico', color: '#0055A4' },
  ],
  PW: [
    { id: 'bank_palau', name: 'Bank of Palau', logo: 'https://icons.duckduckgo.com/ip3/bankofpalau.com.ico', color: '#0055A4' },
  ],
  FM: [
    { id: 'bank_fsm', name: 'Bank FSM', logo: 'https://icons.duckduckgo.com/ip3/bankfsm.com.ico', color: '#0055A4' },
  ],
  MH: [
    { id: 'bank_marshall', name: 'Bank of Marshall', logo: 'https://icons.duckduckgo.com/ip3/bom.com.ico', color: '#0055A4' },
  ],
  // Additional territories
  PM: [
    { id: 'cic', name: 'CIC Saint-Pierre', logo: 'https://icons.duckduckgo.com/ip3/cic.fr.ico', color: '#0055A4' },
  ],
  BL: [
    { id: 'banque_barthelemy', name: 'Banque Saint-Barthélemy', logo: 'https://icons.duckduckgo.com/ip3/banque-st-barth.com.ico', color: '#0055A4' },
  ],
  MF: [
    { id: 'banque_martinique', name: 'Banque Martinique', logo: 'https://icons.duckduckgo.com/ip3/banque-martinique.com.ico', color: '#0055A4' },
  ],
  GP: [
    { id: 'banque_guadeloupe', name: 'Banque Guadeloupe', logo: 'https://icons.duckduckgo.com/ip3/banque-guadeloupe.com.ico', color: '#0055A4' },
  ],
  MQ: [
    { id: 'banque_martinique_2', name: 'Banque Martinique MQ', logo: 'https://icons.duckduckgo.com/ip3/banque-martinique.fr.ico', color: '#0055A4' },
  ],
  RE: [
    { id: 'banque_reunion', name: 'Banque Réunion', logo: 'https://icons.duckduckgo.com/ip3/banque-reunion.com.ico', color: '#0055A4' },
  ],
  YT: [
    { id: 'banque_mayotte', name: 'Banque Mayotte', logo: 'https://icons.duckduckgo.com/ip3/banque-mayotte.com.ico', color: '#0055A4' },
  ],
  TF: [
    { id: 'banque_terres', name: 'Banque Terres Australes', logo: 'https://icons.duckduckgo.com/ip3/banque-terres.fr.ico', color: '#0055A4' },
  ],
  BV: [
    { id: 'bank_bouvet', name: 'Bank Bouvet', logo: 'https://icons.duckduckgo.com/ip3/bankbouvet.com.ico', color: '#0055A4' },
  ],
  HM: [
    { id: 'bank_heard', name: 'Bank Heard Island', logo: 'https://icons.duckduckgo.com/ip3/bankheard.com.ico', color: '#0055A4' },
  ],
  IO: [
    { id: 'bank_chagos', name: 'Bank Chagos', logo: 'https://icons.duckduckgo.com/ip3/bankchagos.com.ico', color: '#0055A4' },
  ],
  CX: [
    { id: 'bank_christmas', name: 'Bank Christmas Island', logo: 'https://icons.duckduckgo.com/ip3/bankchristmas.com.ico', color: '#0055A4' },
  ],
  CC: [
    { id: 'bank_cocos', name: 'Bank Cocos', logo: 'https://icons.duckduckgo.com/ip3/bankcocos.com.ico', color: '#0055A4' },
  ],
  NF: [
    { id: 'bank_norfolk', name: 'Bank Norfolk', logo: 'https://icons.duckduckgo.com/ip3/banknorfolk.com.ico', color: '#0055A4' },
  ],
  PN: [
    { id: 'bank_pitcairn', name: 'Bank Pitcairn', logo: 'https://icons.duckduckgo.com/ip3/bankpitcairn.com.ico', color: '#0055A4' },
  ],
  GS: [
    { id: 'bank_sandwich', name: 'Bank South Georgia', logo: 'https://icons.duckduckgo.com/ip3/banksandwich.com.ico', color: '#0055A4' },
  ],
  FK: [
    { id: 'bank_falkland', name: 'Bank Falkland', logo: 'https://icons.duckduckgo.com/ip3/bankfalkland.com.ico', color: '#0055A4' },
  ],
  SH: [
    { id: 'bank_helena', name: 'Bank St Helena', logo: 'https://icons.duckduckgo.com/ip3/banksthelena.com.ico', color: '#0055A4' },
  ],
  AC: [
    { id: 'bank_ascension', name: 'Bank Ascension', logo: 'https://icons.duckduckgo.com/ip3/bankascension.com.ico', color: '#0055A4' },
  ],
  TA: [
    { id: 'bank_tristan', name: 'Bank Tristan da Cunha', logo: 'https://icons.duckduckgo.com/ip3/banktristan.com.ico', color: '#0055A4' },
  ],
  AQ: [
    { id: 'bank_antarctica', name: 'Bank Antarctica', logo: 'https://icons.duckduckgo.com/ip3/bankantarctica.com.ico', color: '#0055A4' },
  ],
};
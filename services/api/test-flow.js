const http = require('http');

// Configuration
const API_URL = 'http://localhost:5000/api';
const EMAIL = `test-${Date.now()}@example.com`;
const PASSWORD = 'password123';

// Helper to make HTTP requests
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, body: parsed });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          console.error('Failed to parse response:', body);
          reject({ status: res.statusCode, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTest() {
  try {
    console.log('1. Registering new user...');
    const registerRes = await request('POST', '/auth/register', {
      email: EMAIL,
      password: PASSWORD,
      full_name: 'Test User'
    });
    console.log('   Success! Token received.');
    const token = registerRes.token;

    console.log('\n2. Fetching bank providers...');
    const providersRes = await request('GET', '/bank/providers', null, token);
    console.log(`   Success! Found ${providersRes.providers.length} providers.`);
    
    // Check if Plaid is available
    const plaid = providersRes.providers.find(p => p.id === 'plaid');
    if (!plaid) {
      throw new Error('Plaid provider not found!');
    }
    console.log('   Plaid provider is available.');

    console.log('\n3. Creating Plaid Link Token...');
    const linkTokenRes = await request('POST', '/bank/link-token/plaid', {}, token);
    console.log('   Success! Link Token:', linkTokenRes.link_token);

    if (linkTokenRes.link_token.startsWith('demo-')) {
      console.log('   (Demo token detected, which is expected for demo mode)');
    } else {
      console.log('   (Real Plaid token generated)');
    }

    console.log('\n4. Simulating Plaid Callback (Demo Mode)...');
    // Simulate a successful Plaid Link callback
    const connectRes = await request('POST', '/bank/connect/plaid', {
      public_token: `demo-token-chase-${Date.now()}`,
      metadata: {
        institution: { name: 'Chase Bank', id: 'chase' },
        account: { name: 'Checking' }
      }
    }, token);
    console.log('   Success! Bank connected.');
    console.log('   Connection ID:', connectRes.connection.id);

    console.log('\n5. Verifying accounts...');
    const accountsRes = await request('GET', '/bank/accounts', null, token);
    console.log(`   Found ${accountsRes.connections.length} connections.`);
    
    const connection = accountsRes.connections[0];
    if (connection) {
      console.log(`   Connection: ${connection.institutionName} (${connection.syncStatus})`);
      console.log(`   Accounts: ${connection.accounts.length}`);
      connection.accounts.forEach(acc => {
        console.log(`     - ${acc.name}: $${acc.currentBalance}`);
      });
    }

    console.log('\nTest completed successfully! ✅');

  } catch (error) {
    console.error('\nTest failed! ❌');
    console.error(error);
    process.exit(1);
  }
}

runTest();

require('dotenv').config();
const base = `http://localhost:${process.env.PORT || 4000}`;

async function run() {
  try {
    console.log('GET /items');
    let r = await fetch(base + '/items');
    console.log('Status:', r.status);
    console.log('Body:', await r.json());

    console.log('\nPOST /items (create)');
    r = await fetch(base + '/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Test Item ${Date.now()}`, sell_price: 1.23 })
    });
    console.log('Status:', r.status);
    console.log('Body:', await r.json());

    console.log('\nPOST /api/v1/register');
    const email = `testuser+${Date.now()}@example.com`;
    r = await fetch(base + '/api/v1/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email, password: 'pass' })
    });
    console.log('Status:', r.status);
    console.log('Body:', await r.json());

    console.log('\nGET /items (after create)');
    r = await fetch(base + '/items');
    console.log('Status:', r.status);
    const parts = await r.json();
    console.log('Items count:', parts.length);

    console.log('\nAPI tests complete.');
  } catch (e) {
    console.error('API test failed:', e.message);
    process.exitCode = 1;
  }
}

if (require.main === module) run();

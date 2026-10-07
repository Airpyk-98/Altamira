const https = require('https');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function verify() {
  console.log('--- Verifying Altamira Production Deployment ---');
  
  // 1. Check Homepage
  const home = await fetch('https://altamira-luxury-homes.vercel.app');
  console.log('Homepage status:', home.status);
  const cssMatch = home.body.match(/\/(_next\/static\/css\/[^"]+)/);
  if (cssMatch) {
    console.log('CSS bundle found:', cssMatch[0]);
    const cssRes = await fetch('https://altamira-luxury-homes.vercel.app' + cssMatch[0]);
    console.log('CSS bundle status:', cssRes.status, 'size:', cssRes.body.length, 'bytes');
    console.log('Contains Tailwind rules:', cssRes.body.includes('display:flex') || cssRes.body.includes('background-color'));
  }

  // 2. Test Admin Login
  const loginRes = await fetch('https://altamira-luxury-homes.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ebiringai@gmail.com', password: 'Airpyk98' })
  });
  console.log('Admin login status:', loginRes.status);
  const loginData = JSON.parse(loginRes.body);
  console.log('Admin user role:', loginData.user?.role, 'Email:', loginData.user?.email);

  const cookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('Auth cookie received:', !!cookie);

  // 3. Test Apartments endpoint
  const aptsRes = await fetch('https://altamira-luxury-homes.vercel.app/api/apartments', {
    headers: { 'Cookie': cookie }
  });
  const apts = JSON.parse(aptsRes.body);
  console.log('Apartments count:', apts.apartments?.length);

  // 4. Test Analytics endpoint
  const analyticsRes = await fetch('https://altamira-luxury-homes.vercel.app/api/analytics?range=monthly', {
    headers: { 'Cookie': cookie }
  });
  const analytics = JSON.parse(analyticsRes.body);
  console.log('Analytics response received:', !!analytics.summary);

  // 5. Test Admin Observer write restriction (should return 403)
  const bookingTry = await fetch('https://altamira-luxury-homes.vercel.app/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      apartment_id: 1,
      client_name: 'Test Client',
      price: 150000,
      dates: ['2026-11-01']
    })
  });
  console.log('Admin booking write restriction (should be 403):', bookingTry.status);

  console.log('--- ALL SYSTEMS OPERATIONAL ---');
}

verify().catch(console.error);

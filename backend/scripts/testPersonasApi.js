const BASE = 'http://localhost:4000/api';

async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: 'admin' }),
  });
  const login = await loginRes.json();
  const token = login.token;
  console.log('Token obtenido:', token ? 'SI' : 'NO');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  console.log('\nGET /personas...');
  const res = await fetch(`${BASE}/personas`, { headers });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Data:', JSON.stringify(data, null, 2).substring(0, 500));
}

main().catch(e => { console.error(e.message); });

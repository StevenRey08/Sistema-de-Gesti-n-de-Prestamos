const BASE = 'http://localhost:4000/api';
const fs = require('fs');
const path = require('path');

async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: 'admin' }),
  });
  const login = await loginRes.json();
  const token = login.token;
  const headers = { 'Authorization': `Bearer ${token}` };

  console.log('=== TEST PDF GENERATION ===\n');

  const pdfRes = await fetch(`${BASE}/prestamos/823cbfe8-4674-4df9-ae89-0c522d1e14a5/pdf`, { headers });
  console.log('PDF status:', pdfRes.status);
  console.log('Content-Type:', pdfRes.headers.get('content-type'));

  if (pdfRes.ok) {
    const arrayBuffer = await pdfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const outPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(outPath, buffer);
    console.log('PDF saved to:', outPath);
    console.log('Size:', buffer.length, 'bytes');
  } else {
    const text = await pdfRes.text();
    console.log('Error:', text);
  }
}

main().catch(e => console.error(e.message));

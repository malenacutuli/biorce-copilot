// Seed script that calls the running dev server's tRPC API
// The server has a working DB connection, so we use it

const BASE = 'http://localhost:3000';

// First, get a session cookie by logging in
async function getSession() {
  // Use the internal admin seed endpoint if it exists, otherwise use tRPC directly
  const resp = await fetch(`${BASE}/api/trpc/partnerships.list?input={"limit":1}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  const text = await resp.text();
  console.log('Server status:', resp.status, text.substring(0, 100));
  return resp.headers.get('set-cookie');
}

await getSession();

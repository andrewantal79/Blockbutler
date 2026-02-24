/**
 * BlockButler API Server
 * Mimics json-server behaviour: each top-level key in blockbutler-db.json
 * becomes a GET endpoint at /:key (returns the array / object).
 * Runs on port 3001.
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'blockbutler-db.json');
const PORT    = 3001;

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

const server = http.createServer((req, res) => {
  // CORS headers — allow the React dev server on any port
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Strip leading slash and any query string
  const key = req.url.replace(/^\//, '').split('?')[0];

  try {
    const db = readDb();

    if (key === '' || key === 'health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', endpoints: Object.keys(db) }));
      return;
    }

    if (db.hasOwnProperty(key)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db[key]));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `No resource "${key}"` }));
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`BlockButler API listening on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  try {
    const db = readDb();
    Object.keys(db).forEach(k => console.log(`  GET /${k}`));
  } catch(e) {
    console.error('Could not read DB:', e.message);
  }
});

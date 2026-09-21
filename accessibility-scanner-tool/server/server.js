const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

function getWebsites() {
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get('websites');
  if (!row) return [];
  try {
    return JSON.parse(row.value);
  } catch (error) {
    console.error('Failed to parse websites from database:', error);
    return [];
  }
}

function saveWebsites(websites) {
  const value = JSON.stringify(websites);
  const stmt = db.prepare(
    'INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  stmt.run('websites', value);
}

app.get('/api/websites', (req, res) => {
  const websites = getWebsites();
  res.json(websites);
});

app.post('/api/websites', (req, res) => {
  const website = req.body;
  if (!website || !website.id) {
    return res.status(400).json({ error: 'Website with id is required' });
  }

  const websites = getWebsites();
  const existingIndex = websites.findIndex((w) => w.id === website.id);

  if (existingIndex >= 0) {
    websites[existingIndex] = website;
  } else {
    websites.push(website);
  }

  saveWebsites(websites);
  res.json(website);
});

app.delete('/api/websites/:id', (req, res) => {
  const { id } = req.params;
  const websites = getWebsites();
  const filtered = websites.filter((w) => w.id !== id);
  saveWebsites(filtered);
  res.status(204).end();
});

app.post('/api/websites/:id/scan', (req, res) => {
  const { id } = req.params;
  const scanResult = req.body;

  if (!scanResult) {
    return res.status(400).json({ error: 'scanResult is required' });
  }

  const websites = getWebsites();
  const website = websites.find((w) => w.id === id);

  if (!website) {
    return res.status(404).json({ error: 'Website not found' });
  }

  if (!Array.isArray(website.scanHistory)) {
    website.scanHistory = [];
  }

  website.scanHistory.unshift(scanResult);
  website.scanHistory = website.scanHistory.slice(0, 20);
  website.lastScanned = new Date().toISOString();

  const existingIndex = websites.findIndex((w) => w.id === id);
  websites[existingIndex] = website;
  saveWebsites(websites);

  res.json(website);
});

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

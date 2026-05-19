const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1502286069662613696/oxQCTg6buRmGof7FsQg6X0E1q5cwpIbkKkZQPtiwdgkBvILyZtRNg4hyyx-GaGtqANfj';

// Data file path - persist on server
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch(e) {}
  return { orders: [], companies: [], products: null };
}

function saveData(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch(e) {}
}

let db = loadData();

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname)));

// ── GET all data (sync) ──
app.get('/api/data', (req, res) => {
  res.json({ orders: db.orders, companies: db.companies, products: db.products });
});

// ── SAVE orders ──
app.post('/api/orders', (req, res) => {
  db.orders = req.body.orders || db.orders;
  saveData(db);
  res.json({ ok: true });
});

// ── SAVE companies ──
app.post('/api/companies', (req, res) => {
  db.companies = req.body.companies || db.companies;
  saveData(db);
  res.json({ ok: true });
});

// ── SAVE products ──
app.post('/api/products', (req, res) => {
  db.products = req.body.products || db.products;
  saveData(db);
  res.json({ ok: true });
});

// ── Discord notify ──
app.post('/api/notify', async (req, res) => {
  try {
    const order = req.body;
    const prodLines = (order.products||[]).map(p => `> **${p.name}** — ${p.qty} × $${p.price} = **$${p.qty * p.price}**`).join('\n');
    const embed = {
      embeds: [{
        title: '🛒 Nouvelle commande — ' + order.id,
        color: 0xC9A84C,
        fields: [
          { name: '🏢 Entreprise', value: order.company || '—', inline: true },
          { name: '📞 Téléphone', value: order.tel || '—', inline: true },
          { name: '🏦 IBAN', value: '||' + (order.iban || '—') + '||', inline: true },
          { name: '📦 Produits', value: prodLines || '—', inline: false },
          { name: '⚖️ Poids', value: order.weight + ' kg', inline: true },
          { name: '🚚 Livraison', value: order.freeDelivery ? '✅ Offerte' : '$50', inline: true },
          { name: '💰 Total', value: '**$' + order.total.toLocaleString() + '**', inline: true },
          { name: '📍 Adresse', value: order.adresse || '—', inline: false },
          { name: '📅 Date', value: order.date, inline: true },
          { name: '🕐 Horaire', value: order.horaire, inline: true },
        ],
        footer: { text: 'LTD Sandy Shores · Espace Particulier' },
        timestamp: new Date().toISOString()
      }]
    };
    await fetch(DISCORD_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('LTD Sandy Shores on port', PORT));

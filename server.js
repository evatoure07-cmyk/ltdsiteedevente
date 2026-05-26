const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1508787608833233006/7N7lNl8o8pSfdWn5ydHeXqNkTwZ0BVqCVjC5e5i4HOKuhJ8mRlrv3NuxDgCtt1h8GUv2';
const JS_GET = 'https://api.jsonstorage.net/v1/json/2f2bc2b0-9d3a-4d2e-b3b3-517b33ed9011/d17176bc-b948-4513-9617-d9531eb9febe';
const JS_PUT = 'https://api.jsonstorage.net/v1/json/2f2bc2b0-9d3a-4d2e-b3b3-517b33ed9011/d17176bc-b948-4513-9617-d9531eb9febe?apiKey=b34dac67-5c67-4ddd-8ed4-e0337941bfdb';

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/api/data', async (req, res) => {
  try {
    const r = await fetch(JS_GET);
    const data = await r.json();
    res.json(data);
  } catch(e) {
    res.json({ orders: [], companies: [], products: null });
  }
});

app.post('/api/save', async (req, res) => {
  try {
    await fetch(JS_PUT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ ok: false });
  }
});

app.post('/api/notify', async (req, res) => {
  try {
    const order = req.body;
    const prodLines = (order.products||[]).map(p => `> **${p.name}** — ${p.qty} x $${p.price} = **$${p.qty * p.price}**`).join('\n');
    const embed = {
      embeds: [{
        title: 'Nouvelle commande — ' + order.id,
        color: 0xC9A84C,
        fields: [
          { name: 'Entreprise', value: order.company || '—', inline: true },
          { name: 'Telephone', value: order.tel || '—', inline: true },
          { name: 'IBAN', value: '||' + (order.iban || '—') + '||', inline: true },
          { name: 'Produits', value: prodLines || '—', inline: false },
          { name: 'Poids', value: order.weight + ' kg', inline: true },
          { name: 'Livraison', value: order.freeDelivery ? 'Offerte' : '$50', inline: true },
          { name: 'Total', value: '$' + order.total.toLocaleString(), inline: true },
          { name: 'Adresse', value: order.adresse || '—', inline: false },
          { name: 'Date', value: order.date, inline: true },
          { name: 'Horaire', value: order.horaire, inline: true },
        ],
        footer: { text: 'LTD Sandy Shores' },
        timestamp: new Date().toISOString()
      }]
    };
    await fetch(DISCORD_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ ok: false });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('LTD Sandy Shores on port', PORT));

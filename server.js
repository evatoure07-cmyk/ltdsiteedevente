const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1502286069662613696/oxQCTg6buRmGof7FsQg6X0E1q5cwpIbkKkZQPtiwdgkBvILyZtRNg4hyyx-GaGtqANfj';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/notify', async (req, res) => {
  try {
    const order = req.body;
    const prodLines = order.products.map(p => `> **${p.name}** — ${p.qty} × $${p.price} = **$${p.qty * p.price}**`).join('\n');

    const embed = {
      embeds: [{
        title: '🛒 Nouvelle commande — ' + order.id,
        color: 0xC9A84C,
        fields: [
          { name: '🏢 Entreprise', value: order.company || '—', inline: true },
          { name: '📞 Téléphone', value: order.tel || '—', inline: true },
          { name: '🏦 IBAN', value: '||' + (order.iban || '—') + '||', inline: true },
          { name: '📦 Produits', value: prodLines || '—', inline: false },
          { name: '⚖️ Poids total', value: order.weight + ' kg', inline: true },
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

    const response = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });

    if (response.ok) {
      res.json({ success: true });
    } else {
      const text = await response.text();
      res.status(500).json({ success: false, error: text });
    }
  } catch (err) {
    console.error('Discord error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LTD Sandy Shores running on port ${PORT}`);
});

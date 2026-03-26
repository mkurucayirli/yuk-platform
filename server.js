const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let loads = [
  {
    from: "Ankara",
    to: "İzmir",
    vehicle: "Tır",
    type: "Tenteli",
    weight: "",
    price: "",
    time: "2 dk önce",
    phone: "05320000000",
    rawText: "Ankara -> İzmir tır tenteli"
  },
  {
    from: "Bandırma",
    to: "Bolu",
    vehicle: "",
    type: "Damper",
    weight: "",
    price: "30000",
    time: "5 dk önce",
    phone: "05330000000",
    rawText: "BANDIRMA/BOLU/DAMPER 30.000"
  }
];

function safe(v) {
  return (v || "").toString().trim();
}

app.get("/", (req, res) => {
  let html = `
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Yük Platformu</title>
    <style>
      body { font-family: Arial; padding:20px; max-width:900px; margin:auto; }
      .card { border:1px solid #ccc; padding:15px; margin-bottom:12px; border-radius:10px; }
      .btn { background:black; color:white; padding:10px 14px; display:inline-block; margin-top:10px; text-decoration:none; border-radius:8px; }
      .meta { color:#333; margin-top:6px; }
      .raw { color:#666; font-size:13px; margin-top:8px; }
      input { padding:8px; width:260px; }
      button { padding:10px 14px; background:black; color:white; border:none; cursor:pointer; border-radius:8px; }
      .time { color:#888; font-size:13px; margin-top:8px; }
      .line { margin-top:6px; }
    </style>
  </head>
  <body>
    <h2>🚚 Yük Listesi</h2>

    <h3>➕ Test için Manuel Yük Ekle</h3>
    <form method="POST" action="/add">
      <input name="from" placeholder="Nereden" required><br><br>
      <input name="to" placeholder="Nereye" required><br><br>
      <input name="vehicle" placeholder="Araç tipi"><br><br>
      <input name="type" placeholder="Kasa tipi"><br><br>
      <input name="weight" placeholder="Ağırlık"><br><br>
      <input name="price" placeholder="Fiyat"><br><br>
      <input name="phone" placeholder="Telefon" required><br><br>
      <input name="rawText" placeholder="Ham mesaj"><br><br>
      <button type="submit">Ekle</button>
    </form>

    <hr>
  `;

  loads.forEach(l => {
    const parts = [safe(l.vehicle), safe(l.type), safe(l.weight), safe(l.price) ? `Fiyat: ${safe(l.price)}` : ""].filter(Boolean);

    html += `
      <div class="card">
        <div><b>${safe(l.from)} → ${safe(l.to)}</b></div>
        ${parts.length ? `<div class="meta">${parts.join(" | ")}</div>` : ""}
        ${safe(l.phone) ? `<a class="btn" href="tel:${safe(l.phone)}">Ara: ${safe(l.phone)}</a>` : ""}
        <div class="time">${safe(l.time)}</div>
        ${safe(l.rawText) ? `<div class="raw">Ham mesaj: ${safe(l.rawText)}</div>` : ""}
      </div>
    `;
  });

  html += `</body></html>`;
  res.send(html);
});

app.post("/add", (req, res) => {
  const { from, to, vehicle, type, weight, price, phone, rawText } = req.body;

  if (!safe(from) || !safe(to) || !safe(phone)) {
    return res.status(400).send("from, to, phone zorunlu");
  }

  loads.unshift({
    from: safe(from),
    to: safe(to),
    vehicle: safe(vehicle),
    type: safe(type),
    weight: safe(weight),
    price: safe(price),
    time: "şimdi",
    phone: safe(phone),
    rawText: safe(rawText)
  });

  res.redirect("/");
});

app.post("/api/import", (req, res) => {
  const { from, to, vehicle, type, weight, price, phone, rawText, apiKey } = req.body;

  if (apiKey !== "123456") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Net kural: rota + telefon zorunlu
  if (!safe(from) || !safe(to) || !safe(phone)) {
    return res.status(400).json({ ok: false, error: "Rota ve telefon zorunlu" });
  }

  loads.unshift({
    from: safe(from),
    to: safe(to),
    vehicle: safe(vehicle),
    type: safe(type),
    weight: safe(weight),
    price: safe(price),
    time: "otomatik",
    phone: safe(phone),
    rawText: safe(rawText)
  });

  res.json({ ok: true, message: "Yük eklendi" });
});

app.listen(3000, () => {
  console.log("Server running");
});

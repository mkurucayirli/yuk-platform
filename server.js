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
    time: "2 dk önce",
    phone: "05320000000"
  },
  {
    from: "İstanbul",
    to: "Bursa",
    vehicle: "Kamyon",
    type: "Kapalı",
    time: "5 dk önce",
    phone: "05330000000"
  }
];

app.get("/", (req, res) => {
  let html = `
  <html>
  <head>
    <title>Yük Platformu</title>
    <style>
      body { font-family: Arial; padding:20px; }
      .card { border:1px solid #ccc; padding:15px; margin-bottom:10px; border-radius:10px;}
      .btn { background:black; color:white; padding:10px; display:inline-block; margin-top:10px; text-decoration:none; }
      input { padding:8px; width:240px; }
      button { padding:10px; background:black; color:white; border:none; cursor:pointer; }
    </style>
  </head>
  <body>
    <h2>🚚 Yük Listesi</h2>

    <h3>➕ Yeni Yük Ekle</h3>
    <form method="POST" action="/add">
      <input name="from" placeholder="Nereden" required><br><br>
      <input name="to" placeholder="Nereye" required><br><br>
      <input name="vehicle" placeholder="Araç tipi" required><br><br>
      <input name="type" placeholder="Kasa tipi" required><br><br>
      <input name="phone" placeholder="Telefon" required><br><br>
      <button type="submit">Ekle</button>
    </form>

    <hr>
  `;

  loads.forEach(l => {
    html += `
      <div class="card">
        <b>${l.from} → ${l.to}</b><br>
        ${l.vehicle} | ${l.type}<br>
        ${l.time}<br>
        <a class="btn" href="tel:${l.phone}">Ara</a>
      </div>
    `;
  });

  html += `</body></html>`;
  res.send(html);
});

app.post("/add", (req, res) => {
  const { from, to, vehicle, type, phone } = req.body;

  loads.unshift({
    from,
    to,
    vehicle,
    type,
    time: "şimdi",
    phone
  });

  res.redirect("/");
});

// Collector bu endpoint'e veri gönderecek
app.post("/api/import", (req, res) => {
  const { from, to, vehicle, type, phone, apiKey } = req.body;

  if (apiKey !== "123456") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!from || !to || !vehicle || !type || !phone) {
    return res.status(400).json({ ok: false, error: "Eksik alan var" });
  }

  loads.unshift({
    from,
    to,
    vehicle,
    type,
    time: "otomatik",
    phone
  });

  res.json({ ok: true, message: "Yük eklendi" });
});

app.listen(3000, () => {
  console.log("Server running");
});

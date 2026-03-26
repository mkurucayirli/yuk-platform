const express = require("express");
const app = express();

app.use(express.json());

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
      .btn { background:black; color:white; padding:10px; display:inline-block; margin-top:10px;}
    </style>
  </head>
  <body>
    <h2>🚚 Yük Listesi</h2>
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

app.listen(3000, () => {
  console.log("Server running");
});

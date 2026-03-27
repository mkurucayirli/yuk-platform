const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Başlangıçta örnek veri yok
let loads = [];

function safe(v) {
  return (v || "").toString().trim();
}

app.get("/", (req, res) => {
  const serializedLoads = JSON.stringify(loads);

  const html = `
  <!doctype html>
  <html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Yük Platformu</title>
    <style>
      :root{
        --text:#eaf2ff;
        --muted:#9fb3d6;
        --accent:#6aa6ff;
        --accent2:#7ef0ff;
        --shadow: 0 20px 50px rgba(0,0,0,.45);
      }

      *{ box-sizing:border-box; }
      html,body{ margin:0; padding:0; }
      body{
        font-family: Inter, Arial, sans-serif;
        color:var(--text);
        min-height:100vh;
        background:
          radial-gradient(circle at top left, rgba(80,130,255,.20), transparent 30%),
          radial-gradient(circle at top right, rgba(0,255,255,.10), transparent 25%),
          linear-gradient(180deg, #06101d 0%, #091426 45%, #07111f 100%);
      }

      .grid-bg{
        position:fixed;
        inset:0;
        background-image:
          linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
        background-size: 36px 36px;
        mask-image: linear-gradient(to bottom, rgba(0,0,0,.95), rgba(0,0,0,.65));
        pointer-events:none;
      }

      .container{
        max-width: 1320px;
        margin: 0 auto;
        padding: 28px 18px 60px;
        position:relative;
        z-index:1;
      }

      .hero{
        display:flex;
        flex-wrap:wrap;
        gap:18px;
        align-items:stretch;
        margin-bottom:22px;
      }

      .hero-left{
        flex: 1 1 740px;
        min-width: 320px;
        padding: 26px;
        border:1px solid rgba(126,240,255,.18);
        border-radius: 28px;
        background:
          linear-gradient(180deg, rgba(17,33,63,.88), rgba(10,21,40,.86));
        box-shadow: var(--shadow);
        position:relative;
        overflow:hidden;
      }

      .hero-left::before{
        content:"";
        position:absolute;
        inset:-2px;
        border-radius:28px;
        padding:1px;
        background: linear-gradient(135deg, rgba(126,240,255,.35), rgba(106,166,255,.18), transparent 60%);
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events:none;
      }

      .badge{
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:8px 12px;
        border-radius:999px;
        border:1px solid rgba(126,240,255,.22);
        background: rgba(12,30,54,.85);
        color: var(--accent2);
        font-size:12px;
        letter-spacing:.12em;
        text-transform:uppercase;
        margin-bottom:14px;
      }

      h1{
        margin:0 0 10px;
        font-size: clamp(30px, 4vw, 52px);
        line-height:1.04;
        letter-spacing:-0.03em;
      }

      .sub{
        color:var(--muted);
        max-width:760px;
        line-height:1.6;
        font-size:15px;
      }

      .hero-right{
        flex: 0 1 320px;
        min-width:280px;
        display:grid;
        grid-template-columns: 1fr;
        gap:16px;
      }

      .stat-card{
        padding:18px 18px 16px;
        border-radius:24px;
        border:1px solid rgba(106,166,255,.18);
        background:
          linear-gradient(180deg, rgba(16,31,59,.92), rgba(10,20,39,.88));
        box-shadow: var(--shadow);
        transform: perspective(1000px) rotateX(6deg);
      }

      .stat-label{
        color:var(--muted);
        font-size:12px;
        text-transform:uppercase;
        letter-spacing:.12em;
        margin-bottom:8px;
      }

      .stat-value{
        font-size:30px;
        font-weight:800;
        letter-spacing:-0.03em;
      }

      .stat-note{
        margin-top:6px;
        color:#bfd0ee;
        font-size:13px;
      }

      .panel{
        border:1px solid rgba(106,166,255,.18);
        border-radius:28px;
        background:
          linear-gradient(180deg, rgba(14,29,54,.88), rgba(9,19,36,.92));
        box-shadow: var(--shadow);
        overflow:hidden;
      }

      .panel-head{
        display:flex;
        flex-wrap:wrap;
        justify-content:space-between;
        align-items:center;
        gap:14px;
        padding:20px 22px;
        border-bottom:1px solid rgba(126,240,255,.10);
      }

      .panel-title{
        font-size:20px;
        font-weight:800;
        letter-spacing:-0.02em;
      }

      .panel-sub{
        color:var(--muted);
        font-size:14px;
        margin-top:4px;
      }

      .controls{
        display:grid;
        grid-template-columns: repeat(6, minmax(0,1fr));
        gap:14px;
        padding:20px 22px 10px;
      }

      .field{
        display:flex;
        flex-direction:column;
        gap:8px;
      }

      .field label{
        color:#cfe0ff;
        font-size:12px;
        text-transform:uppercase;
        letter-spacing:.12em;
      }

      .input{
        width:100%;
        height:48px;
        border-radius:16px;
        border:1px solid rgba(106,166,255,.22);
        background: rgba(9,20,39,.88);
        color:var(--text);
        padding:0 14px;
        outline:none;
        transition:.2s ease;
      }

      .input::placeholder{
        color:#7f95bb;
      }

      .input:focus{
        border-color: rgba(126,240,255,.55);
        box-shadow: 0 0 0 4px rgba(106,166,255,.14);
      }

      .actions{
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        padding: 6px 22px 22px;
      }

      .btn{
        height:46px;
        border:none;
        border-radius:16px;
        padding:0 18px;
        cursor:pointer;
        font-weight:700;
        letter-spacing:.01em;
        transition:.2s ease;
      }

      .btn-primary{
        color:#031120;
        background: linear-gradient(135deg, var(--accent2), var(--accent));
        box-shadow: 0 12px 30px rgba(106,166,255,.28);
      }

      .btn-primary:hover{
        transform: translateY(-1px);
      }

      .btn-secondary{
        color:var(--text);
        background: rgba(13,26,49,.9);
        border:1px solid rgba(106,166,255,.25);
      }

      .btn-secondary:hover{
        background: rgba(18,35,64,.96);
      }

      .results-bar{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:14px;
        padding: 0 22px 18px;
        color: var(--muted);
        font-size:14px;
      }

      .cards{
        display:grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap:18px;
        padding: 0 22px 22px;
      }

      .load-card{
        position:relative;
        min-height:260px;
        padding:20px;
        border-radius:24px;
        border:1px solid rgba(126,240,255,.14);
        background:
          linear-gradient(180deg, rgba(19,38,72,.95), rgba(10,20,39,.94));
        box-shadow:
          0 16px 40px rgba(0,0,0,.40),
          inset 0 1px 0 rgba(255,255,255,.04);
        transform: perspective(1200px) rotateX(6deg);
        display:flex;
        flex-direction:column;
      }

      .load-card::before{
        content:"";
        position:absolute;
        inset:0;
        border-radius:24px;
        background: radial-gradient(circle at top right, rgba(126,240,255,.10), transparent 28%);
        pointer-events:none;
      }

      .route{
        font-size:28px;
        font-weight:900;
        letter-spacing:-0.03em;
        margin-bottom:12px;
        line-height:1.1;
      }

      .route span{
        color: var(--accent2);
      }

      .chips{
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        margin-bottom:14px;
      }

      .chip{
        display:inline-flex;
        align-items:center;
        height:34px;
        padding:0 12px;
        border-radius:999px;
        background: rgba(11,26,50,.92);
        border:1px solid rgba(106,166,255,.20);
        color:#dbe7ff;
        font-size:13px;
      }

      .meta-block{
        display:grid;
        gap:10px;
        margin-bottom:16px;
      }

      .meta-line{
        color:#c8d9f6;
        font-size:14px;
      }

      .meta-line strong{
        color:#ffffff;
        font-weight:700;
      }

      .card-footer{
        display:flex;
        justify-content:space-between;
        align-items:flex-end;
        gap:14px;
        margin-top:auto;
      }

      .call-btn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:138px;
        height:46px;
        padding:0 16px;
        border-radius:16px;
        text-decoration:none;
        color:#031120;
        background: linear-gradient(135deg, #a7daff, #6aa6ff);
        font-weight:800;
        box-shadow: 0 12px 24px rgba(106,166,255,.22);
      }

      .share-time{
        color:#8da7d3;
        font-size:13px;
        text-align:right;
        line-height:1.5;
      }

      .raw{
        margin-top:14px;
        padding-top:12px;
        border-top:1px dashed rgba(126,240,255,.14);
        color:#88a2cf;
        font-size:12px;
        line-height:1.5;
        word-break:break-word;
      }

      .empty{
        grid-column:1/-1;
        padding:28px;
        border-radius:24px;
        border:1px dashed rgba(106,166,255,.24);
        color:#b8cbec;
        text-align:center;
        background: rgba(8,19,37,.75);
      }

      @media (max-width: 1180px){
        .controls{ grid-template-columns: repeat(3, minmax(0,1fr)); }
        .cards{ grid-template-columns: repeat(2, minmax(0,1fr)); }
      }

      @media (max-width: 760px){
        .container{ padding:18px 12px 36px; }
        .hero-left, .panel{ border-radius:22px; }
        .controls{ grid-template-columns: 1fr; }
        .cards{ grid-template-columns: 1fr; padding: 0 16px 16px; }
        .panel-head, .controls, .actions, .results-bar{
          padding-left:16px;
          padding-right:16px;
        }
        .route{ font-size:24px; }
      }
    </style>
  </head>
  <body>
    <div class="grid-bg"></div>

    <div class="container">
      <section class="hero">
        <div class="hero-left">
          <div class="badge">YÜK KOMUTA MERKEZİ</div>
          <h1>Türkiye’nin <span style="color:var(--accent2);">Premium Nakliye Garajı</span></h1>
          <div class="sub">
            Yükü erken gör, doğru filtrele, tek ekranda yönet.
          </div>
        </div>

        <div class="hero-right">
          <div class="stat-card">
            <div class="stat-label">Aktif Yük</div>
            <div class="stat-value" id="statTotal">0</div>
            <div class="stat-note">Filtreye göre güncellenir</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Canlı Durum</div>
            <div class="stat-value">ONLINE</div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">Yük Arama ve Filtreleme</div>
            <div class="panel-sub">Yükleme, boşaltma, araç tipi ve kasa tipine göre filtrele.</div>
          </div>
        </div>

        <div class="controls">
          <div class="field">
            <label>Yükleme Yeri</label>
            <input id="filterFrom" class="input" placeholder="İl ya da İlçe Adı Yazınız" />
          </div>

          <div class="field">
            <label>Boşaltma Yeri</label>
            <input id="filterTo" class="input" placeholder="İl ya da İlçe Adı Yazınız" />
          </div>

          <div class="field">
            <label>Araç Tipi</label>
            <input id="filterVehicle" class="input" placeholder="Örn: Tır, Kamyon, 10 Teker" />
          </div>

          <div class="field">
            <label>Kasa Tipi</label>
            <input id="filterType" class="input" placeholder="Örn: Açık, Tenteli, Damper" />
          </div>

          <div class="field">
            <label>Telefon</label>
            <input id="filterPhone" class="input" placeholder="Örn: 0544" />
          </div>

          <div class="field">
            <label>Kelime Ara</label>
            <input id="filterRaw" class="input" placeholder="Kelime Ara" />
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" onclick="applyFilters()">Filtrele</button>
          <button class="btn btn-secondary" onclick="resetFilters()">Temizle</button>
          <button class="btn btn-secondary" onclick="refreshPage()">Listeyi Yenile</button>
        </div>

        <div class="results-bar">
          <div id="resultsText">Yükler yükleniyor...</div>
          <div></div>
        </div>

        <div class="cards" id="cards"></div>
      </section>
    </div>

    <script>
      const allLoads = ${serializedLoads};

      function safe(v){
        return (v || "").toString().trim();
      }

      function contains(haystack, needle){
        return safe(haystack).toLowerCase().includes(safe(needle).toLowerCase());
      }

      function buildChips(item){
        const chips = [];
        if (safe(item.vehicle)) chips.push(item.vehicle);
        if (safe(item.type)) chips.push(item.type);
        if (safe(item.weight)) chips.push(item.weight);
        if (safe(item.price)) chips.push("Fiyat: " + item.price);
        return chips;
      }

      function renderCards(items){
        const cards = document.getElementById("cards");
        const statTotal = document.getElementById("statTotal");
        const resultsText = document.getElementById("resultsText");

        statTotal.textContent = items.length;
        resultsText.textContent = items.length + " ilan listeleniyor";

        if (!items.length){
          cards.innerHTML = '<div class="empty">Henüz WhatsApp’tan düşen aktif ilan yok.</div>';
          return;
        }

        cards.innerHTML = items.map(item => {
          const chips = buildChips(item);
          return \`
            <div class="load-card">
              <div class="route">\${safe(item.from)} <span>→</span> \${safe(item.to)}</div>

              \${chips.length ? '<div class="chips">' + chips.map(c => '<div class="chip">' + c + '</div>').join('') + '</div>' : ''}

              <div class="meta-block">
                \${safe(item.phone) ? '<div class="meta-line"><strong>Telefon:</strong> ' + safe(item.phone) + '</div>' : ''}
              </div>

              <div class="card-footer">
                \${safe(item.phone) ? '<a class="call-btn" href="tel:' + safe(item.phone) + '">Ara</a>' : '<div></div>'}
                <div class="share-time">\${safe(item.sharedAt) ? 'Paylaşım Zamanı: ' + safe(item.sharedAt) : ''}</div>
              </div>

              \${safe(item.rawText) ? '<div class="raw">Ham mesaj: ' + safe(item.rawText) + '</div>' : ''}
            </div>
          \`;
        }).join("");
      }

      function applyFilters(){
        const from = document.getElementById("filterFrom").value;
        const to = document.getElementById("filterTo").value;
        const vehicle = document.getElementById("filterVehicle").value;
        const type = document.getElementById("filterType").value;
        const phone = document.getElementById("filterPhone").value;
        const raw = document.getElementById("filterRaw").value;

        const filtered = allLoads.filter(item => {
          if (from && !contains(item.from, from)) return false;
          if (to && !contains(item.to, to)) return false;
          if (vehicle && !contains(item.vehicle, vehicle)) return false;
          if (type && !contains(item.type, type)) return false;
          if (phone && !contains(item.phone, phone)) return false;
          if (raw && !contains(item.rawText, raw)) return false;
          return true;
        });

        renderCards(filtered);
      }

      function resetFilters(){
        document.getElementById("filterFrom").value = "";
        document.getElementById("filterTo").value = "";
        document.getElementById("filterVehicle").value = "";
        document.getElementById("filterType").value = "";
        document.getElementById("filterPhone").value = "";
        document.getElementById("filterRaw").value = "";
        renderCards(allLoads);
      }

      function refreshPage(){
        window.location.reload();
      }

      renderCards(allLoads);
    </script>
  </body>
  </html>
  `;

  res.send(html);
});

app.post("/api/import", (req, res) => {
  const { from, to, vehicle, type, weight, price, phone, rawText, sharedAt, apiKey } = req.body;

  if (apiKey !== "123456") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

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
    phone: safe(phone),
    rawText: safe(rawText),
    sharedAt: safe(sharedAt)
  });

  res.json({ ok: true, message: "Yük eklendi" });
});

app.listen(3000, () => {
  console.log("Server running");
});

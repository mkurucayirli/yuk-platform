const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

// =========================
// AYARLAR
// =========================
const SITE_URL = "https://yuk-platform.onrender.com/api/import";
const API_KEY = "123456";
const REQUEST_TIMEOUT = 60000;

// Kısa süreli duplicate koruması
const recentHashes = new Map();
const DUP_TTL_MS = 10 * 60 * 1000; // 10 dk

// =========================
// LOKASYON DİZİNLERİ
// =========================

// 81 il
const cityNames = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin",
  "Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur",
  "Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan",
  "Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul",
  "İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kırıkkale","Kırklareli","Kırşehir",
  "Kilis","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş",
  "Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas",
  "Şanlıurfa","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"
];

// Kullanıcı örneklerinden ve sektörde sık geçen bazı ilçeler
const districtToCity = {
  "Bandırma": "Balıkesir",
  "Edremit": "Balıkesir",
  "Gönen": "Balıkesir",
  "Polatlı": "Ankara",
  "Sincan": "Ankara",
  "Yenimahalle": "Ankara",
  "Çankaya": "Ankara",
  "Kazan": "Ankara",
  "Selçuklu": "Konya",
  "Ereğli": "Konya",
  "Muratpaşa": "Antalya",
  "Başakşehir": "İstanbul",
  "Kartal": "İstanbul",
  "Beşiktaş": "İstanbul",
  "Beylikdüzü": "İstanbul",
  "Tuzla": "İstanbul",
  "Ümraniye": "İstanbul",
  "Avcılar": "İstanbul",
  "Gebze": "Kocaeli",
  "Tarsus": "Mersin",
  "Bornova": "İzmir",
  "Buca": "İzmir",
  "Osmangazi": "Bursa",
  "Nilüfer": "Bursa",
  "Elbistan": "Kahramanmaraş",
  "Başmakçı": "Afyonkarahisar",
  "Karapınar": "Konya",
  "Kahramankazan": "Ankara"
};

function trLower(s) {
  return (s || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .trim();
}

function trUpperTitle(s) {
  if (!s) return "";
  const map = {
    i: "İ", ı: "I", ş: "Ş", ğ: "Ğ", ü: "Ü", ö: "Ö", ç: "Ç"
  };
  const lower = trLower(s);
  return lower
    .split(/\s+/)
    .map(w => {
      if (!w) return w;
      const first = map[w[0]] || w[0].toUpperCase();
      return first + w.slice(1);
    })
    .join(" ");
}

const locationIndex = [];

// İl adlarını ekle
for (const city of cityNames) {
  locationIndex.push({
    label: city,
    norm: trLower(city),
    city: city,
    district: ""
  });
}

// İlçeleri ekle
for (const [district, city] of Object.entries(districtToCity)) {
  locationIndex.push({
    label: district,
    norm: trLower(district),
    city,
    district
  });
}

// En uzun isimler önce eşleşsin
locationIndex.sort((a, b) => b.norm.length - a.norm.length);

// =========================
// YARDIMCILAR
// =========================
function cleanupRecentHashes() {
  const now = Date.now();
  for (const [k, v] of recentHashes.entries()) {
    if (now - v > DUP_TTL_MS) recentHashes.delete(k);
  }
}

function makeHash(item) {
  return [
    trLower(item.from),
    trLower(item.to),
    trLower(item.phone),
    trLower(item.rawText)
  ].join("|");
}

function isDuplicate(item) {
  cleanupRecentHashes();
  const hash = makeHash(item);
  if (recentHashes.has(hash)) return true;
  recentHashes.set(hash, Date.now());
  return false;
}

function normalizeSpaces(text) {
  return (text || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[“”"']/g, " ")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 10 && digits.startsWith("5")) {
    return "0" + digits;
  }
  if (digits.length === 11 && digits.startsWith("05")) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith("90") && digits[2] === "5") {
    return "0" + digits.slice(2);
  }
  if (digits.length === 13 && digits.startsWith("905")) {
    return "0" + digits.slice(2);
  }

  return "";
}

function extractPhone(text) {
  const matches = text.match(/(?:\+?90[\s-]?)?0?5\d(?:[\s-]?\d){8,9}/g) || [];
  for (const m of matches) {
    const normalized = normalizePhone(m);
    if (normalized) return normalized;
  }
  return "";
}

function extractWeight(text) {
  const cleaned = text.replace(/\./g, "").replace(/,/g, ".");
  let m =
    cleaned.match(/(\d+(?:\.\d+)?)\s*ton\b/i) ||
    cleaned.match(/(\d+(?:\.\d+)?)\s*kg\b/i) ||
    cleaned.match(/(\d+(?:\.\d+)?)\s*teker\b/i);

  if (!m) return "";

  const unit = /ton/i.test(m[0]) ? "ton" : /kg/i.test(m[0]) ? "kg" : "teker";
  return `${m[1]} ${unit}`;
}

function extractPrice(text) {
  const noDots = text.replace(/\./g, "");
  const patterns = [
    /(\d{2,6})\s*\+\s*kdv/i,
    /(\d{2,6})\s*art[ıi]\s*kdv/i,
    /(\d{2,6})\s*tl\b/i
  ];

  for (const p of patterns) {
    const m = noDots.match(p);
    if (m) return m[1];
  }

  return "";
}

function containsSeparator(text) {
  return /->|→|\/|~| - |–|—/.test(text);
}

function extractVehicleAndType(text) {
  const n = trLower(text);

  let vehicle = "";
  let type = "";

  // Araç tipi
  if (/\b10 teker\b/.test(n)) vehicle = "10 Teker";
  else if (/\bkamyonet\b/.test(n)) vehicle = "Kamyonet";
  else if (/\bkamyon\b/.test(n)) vehicle = "Kamyon";
  else if (/\bk[ıi]rkayak\b/.test(n)) vehicle = "Kırkayak";
  else if (/\bpanelvan\b/.test(n)) vehicle = "Panelvan";
  else if (/\bt[ıi]r\b/.test(n)) vehicle = "Tır";

  // Kasa tipi
  if (/\bdamper\b|\bd[öo]kme\b/.test(n)) type = "Damper";
  else if (/\blowbed\b/.test(n)) type = "Lowbed";
  else if (/\bfrigo\b/.test(n)) type = "Frigo";
  else if (/\btenteli\b/.test(n)) type = "Tenteli";
  else if (/\bkapal[ıi]\b/.test(n)) type = "Kapalı";
  else if (/\baç[ıi]k\b/.test(n)) type = "Açık";
  else if (/\bsilobas\b/.test(n)) type = "Silobas";
  else if (/\bliftli\b/.test(n)) type = "Liftli";

  return { vehicle, type };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findLocations(text) {
  const normalized = trLower(text);
  const found = [];
  const usedRanges = [];

  function rangeUsed(start, end) {
    return usedRanges.some(r => !(end <= r.start || start >= r.end));
  }

  for (const loc of locationIndex) {
    const re = new RegExp(`(^|[^a-zA-ZçğıöşüÇĞİÖŞÜ])(${escapeRegex(loc.norm)})(?=[^a-zA-ZçğıöşüÇĞİÖŞÜ]|$)`, "g");
    let match;
    while ((match = re.exec(normalized)) !== null) {
      const start = match.index + match[1].length;
      const end = start + loc.norm.length;
      if (rangeUsed(start, end)) continue;

      found.push({
        label: loc.label,
        city: loc.city,
        district: loc.district,
        start,
        end,
        norm: loc.norm
      });
      usedRanges.push({ start, end });
    }
  }

  found.sort((a, b) => a.start - b.start);
  return found;
}

function uniqueOrderedLocations(found) {
  const out = [];
  const seen = new Set();

  for (const loc of found) {
    const key = `${loc.norm}|${trLower(loc.city)}|${trLower(loc.district)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(loc);
    }
  }

  return out;
}

function parseSingleLine(line, phoneFromWholeMessage) {
  const cleanLine = normalizeSpaces(line);
  if (!cleanLine) return null;

  const phone = extractPhone(cleanLine) || phoneFromWholeMessage;
  if (!phone) return null; // telefon yoksa ilan yok

  const locations = uniqueOrderedLocations(findLocations(cleanLine));
  if (locations.length < 2) return null; // en az 2 lokasyon yoksa ilan yok

  const fromLoc = locations[0];
  const toLoc = locations[1];

  const { vehicle, type } = extractVehicleAndType(cleanLine);
  const weight = extractWeight(cleanLine);
  const price = extractPrice(cleanLine);

  return {
    from: trUpperTitle(fromLoc.label),
    to: trUpperTitle(toLoc.label),
    fromCity: trUpperTitle(fromLoc.city),
    toCity: trUpperTitle(toLoc.city),
    vehicle,
    type,
    weight,
    price,
    phone,
    rawText: cleanLine
  };
}

function splitMessageIntoCandidateLines(text) {
  const rawLines = (text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  const result = [];

  for (const line of rawLines) {
    // Bazı mesajlar tek satırda birden fazla rota içermez; şimdilik satır bazlı ilerliyoruz
    result.push(line);
  }

  // Hiç satır yoksa tüm mesajı tek satır dene
  if (!result.length) {
    const one = normalizeSpaces(text);
    if (one) result.push(one);
  }

  return result;
}

// =========================
// API GÖNDERİMİ
// =========================
async function sendToSite(item) {
  const payload = {
    from: item.from,
    to: item.to,
    vehicle: item.vehicle || "",
    type: item.type || "",
    weight: item.weight || "",
    price: item.price || "",
    phone: item.phone,
    rawText: item.rawText,
    apiKey: API_KEY
  };

  const response = await axios.post(SITE_URL, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: REQUEST_TIMEOUT
  });

  return response.data;
}

// =========================
// WHATSAPP CLIENT
// =========================
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "collector-main"
  }),
  puppeteer: {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

client.on("qr", (qr) => {
  console.log("QR OKUT:");
  qrcode.generate(qr, { small: true });
});

client.on("loading_screen", (percent, message) => {
  console.log("Yükleniyor:", percent, message);
});

client.on("authenticated", () => {
  console.log("WhatsApp doğrulandı");
});

client.on("ready", () => {
  console.log("WhatsApp hazır");
});

client.on("auth_failure", (msg) => {
  console.log("Auth hatası:", msg);
});

client.on("disconnected", (reason) => {
  console.log("Bağlantı koptu:", reason);
});

client.on("message", async (msg) => {
  try {
    if (msg.fromMe) return;

    const text = (msg.body || "").trim();
    if (!text) return;

    const chat = await msg.getChat();
    const chatName = chat?.name || msg.from || "Bilinmeyen kaynak";

    console.log("\n==============================");
    console.log("KAYNAK:", chatName);
    console.log("HAM MESAJ:", text);

    const phoneFromWholeMessage = extractPhone(text);
    const lines = splitMessageIntoCandidateLines(text);

    let foundAny = false;

    for (const line of lines) {
      const parsed = parseSingleLine(line, phoneFromWholeMessage);
      if (!parsed) continue;

      if (isDuplicate(parsed)) {
        console.log("Duplicate atlandı:", parsed.rawText);
        continue;
      }

      foundAny = true;
      console.log("PARSE EDİLDİ:", parsed);

      try {
        const result = await sendToSite(parsed);
        console.log("Siteye gönderildi:", result);
      } catch (error) {
        if (error.response) {
          console.log("API hata:", error.response.status, error.response.data);
        } else {
          console.log("API hata:", error.message);
        }
      }
    }

    if (!foundAny) {
      console.log("YAYINLANMADI: rota veya telefon bulunamadı.");
    }
  } catch (err) {
    console.log("Message işleme hatası:", err.message);
  }
});

client.initialize();

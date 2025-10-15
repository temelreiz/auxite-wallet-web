// server.js — Basit Express proxy (CORS fix dahil)
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// 🔒 CloudFront domainini izinli yap
const ALLOWED_ORIGINS = [
  "https://daz23ci1wi8rz.cloudfront.net",
  "https://wallet.auxite.io" // varsa
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked: " + origin));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Proxy örneği: /api/info → https://api.auxite.io/v1/info
app.get("/api/info", async (req, res) => {
  try {
    const r = await fetch("https://api.auxite.io/v1/info");
    const data = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "fetch_failed" });
  }
});

app.listen(3000, () => {
  console.log("✅ Local CORS proxy server started on http://localhost:3000");
});


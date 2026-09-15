// server.js
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const shareRoutes = require("./routes/shareRoutes");
const elementRoutes = require("./routes/elementRoutes");
const contactRoutes = require("./routes/contactRoutes");
const subscribeRoutes = require("./routes/subscribeRoutes");
const path = require("path");
const { publicActionLimiter } = require("./utils/rateLimiters");

const db = require("./models");
const axios = require("axios");

const app = express();

// Trust the first hop of the proxy chain (Vercel's edge) so `req.ip` and
// express-rate-limit resolve the real caller from X-Forwarded-For instead of
// Vercel's internal proxy address. Without this, every request on Vercel
// looked like it came from the same IP, so loginLimiter/sensitiveActionLimiter
// (utils/rateLimiters.js) bucketed every user together — one abusive caller
// could lock out everyone else, while a real attacker spreading requests
// across many IPs got no extra throttling at all. express-rate-limit itself
// detects and warns about this exact misconfiguration on startup.
app.set("trust proxy", 1);

// --- 1. CORS CONFIGURATION ---
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://swales.app",
    "https://www.swales.app",
    "https://designer.swales.app",
    "https://swales-designer.vercel.app",
    "https://swales-services.vercel.app",
    // permaculturetools.online: test domain used to verify the rebuild
    // live before cutting swales.app over to it (2026-08-27).
    "https://permaculturetools.online",
    "https://www.permaculturetools.online",
    "https://designer.permaculturetools.online",
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// Default body-parser limit is 100kb - too small for this API: project
// saves/share-links send a base64 canvas thumbnail inside the JSON body
// (createProject/updateProject's `thumbnail` field), and any real PNG
// screenshot clears 100kb easily, so every save with a thumbnail was
// getting rejected with a 413 before reaching the controller.
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/elements", elementRoutes);
app.use("/api/contact-us", contactRoutes);
app.use("/api/sub", subscribeRoutes);

// Thin proxy in front of globalwindatlas.info, needed because that API
// doesn't send CORS headers - the browser can't call it directly. All four
// routes previously used `.then()` with no `.catch()`, so any upstream
// failure (timeout, 4xx/5xx, DNS hiccup) produced an unhandled promise
// rejection: Express never sent a response and the request hung until the
// platform's own timeout instead of failing fast. Centralized here so the
// fix (and the rate limiter, since this has no auth to rely on) applies
// once instead of four times.
const proxyToGlobalWindAtlas = (upstreamPath) => async (req, res) => {
  try {
    const response = await axios.post(
      `https://globalwindatlas.info${upstreamPath}`,
      req.body,
      { headers: { Referer: "https://globalwindatlas.info/en/" } },
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error(`GWA proxy error (${upstreamPath}):`, err.message);
    res.status(502).json({ success: false, message: "Wind data provider unavailable", data: null, error: null });
  }
};

app.post("/api/temporal", publicActionLimiter, proxyToGlobalWindAtlas("/api/temporal"));
app.post("/api/gwa/custom/windSpeed", publicActionLimiter, proxyToGlobalWindAtlas("/api/gwa/custom/windSpeed"));
app.post("/api/gwa/custom/powerDensity", publicActionLimiter, proxyToGlobalWindAtlas("/api/gwa/custom/powerDensity"));
app.post("/api/gwa/custom/windFrequencyRose", publicActionLimiter, proxyToGlobalWindAtlas("/api/gwa/custom/windFrequencyRose"));
app.post("/api/gwa/custom/windSpeedRose", publicActionLimiter, proxyToGlobalWindAtlas("/api/gwa/custom/windSpeedRose"));

// --- 2. EXPORT FOR VERCEL (Crucial) ---
// Vercel uses this. It does NOT run the code below this line.
module.exports = app;

// --- 3. LOCAL DEV STARTUP ---
// This block ONLY runs if you type "node server.js" in your terminal.
// Schema changes now go through migrations (`npm run migrate`), not an
// auto-alter on every start — see migrations/ and roadmap.md Phase 0.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  console.log("🔄 Checking database connection...");

  db.sequelize
    .authenticate()
    .then(() => {
      console.log("✅ Database connection OK.");
      app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("❌ Database connection failed:", err);
    });
}

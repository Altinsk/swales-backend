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
const path = require("path");

const db = require("./models");
const axios = require("axios");

const app = express();

// --- 1. CORS CONFIGURATION ---
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://swales.app",
    "https://www.swales.app",
    "https://designer.swales.app",
    "https://garden-desinger.vercel.app",
    "https://perma-app-vercel.vercel.app",
  ],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/elements", elementRoutes);

app.post("/api/temporal", async (req, res) => {
  axios
    .post("https://globalwindatlas.info/api/temporal", req.body, {
      headers: { Referer: " https://globalwindatlas.info/en/" },
    })
    .then((response) => {
      res.status(200).json(response.data);
    });
});
app.post("/api/gwa/custom/windSpeed", async (req, res) => {
  // req.body.height = 100;
  axios
    .post("https://globalwindatlas.info/api/gwa/custom/windSpeed", req.body, {
      headers: { Referer: " https://globalwindatlas.info/en/" },
    })
    .then((response) => {
      res.status(200).json(response.data);
    });
});
app.post("/api/gwa/custom/powerDensity", async (req, res) => {
  // req.body.height = 100;
  axios
    .post(
      "https://globalwindatlas.info/api/gwa/custom/powerDensity",
      req.body,
      {
        headers: { Referer: " https://globalwindatlas.info/en/" },
      },
    )
    .then((response) => {
      res.status(200).json(response.data);
    });
});
app.post("/api/gwa/custom/windFrequencyRose", async (req, res) => {
  // req.body.height = 100;
  axios
    .post(
      "https://globalwindatlas.info/api/gwa/custom/windFrequencyRose",
      req.body,
      {
        headers: { Referer: " https://globalwindatlas.info/en/" },
      },
    )
    .then((response) => {
      res.status(200).json(response.data);
    });
});
app.post("/api/gwa/custom/windSpeedRose", async (req, res) => {
  // req.body.height = 100;
  axios
    .post(
      "https://globalwindatlas.info/api/gwa/custom/windSpeedRose",
      req.body,
      {
        headers: { Referer: " https://globalwindatlas.info/en/" },
      },
    )
    .then((response) => {
      res.status(200).json(response.data);
    });
});

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

// server.js
const express = require("express");
const dotenv = require("dotenv");
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

dotenv.config();
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

app.get("/api/db-sync", async (req, res) => {
  try {
    // This triggers the table creation/update
    await db.sequelize.sync({ alter: true });
    res
      .status(200)
      .json({ message: "✅ Database tables synced successfully!" });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ message: "❌ Sync failed", error: error.message });
  }
});
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

// --- 3. LOCAL DEV / SYNC STARTUP ---
// This block ONLY runs if you type "node server.js" in your terminal.
// It will sync your database tables before starting the server.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  console.log("🔄 Checking database connection and syncing tables...");

  // { alter: true } updates tables if columns change without deleting data
  db.sequelize
    .sync({ alter: true })
    .then(() => {
      console.log("✅ Database synced successfully.");
      app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("❌ Database sync failed:", err);
    });
}

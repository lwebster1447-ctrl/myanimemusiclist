// backend/server.js
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import "dotenv/config";
import express from "express";
import cors from "cors";

import { searchAnimeThemes } from "./services/animethemes.js";

const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "https://myanimusiclist-7f120.web.app",
  "https://myanimemusiclist.net"
];

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// ===== SEARCH =====
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toString().trim();

  if (!q) {
    return res.status(400).json({ error: "Query param 'q' is required." });
  }

  console.log(`🔍 API search called for: "${q}"`);

  try {
    let themes = [];
    let albums = [];

    try {
      const animethemesResult = await searchAnimeThemes(q);
      
      for (const song of (animethemesResult.songs || [])) {
        themes.push({
          id: song.id,
          title: song.title,
          anime: song.anime,
          artist: song.artist,
          videoUrl: song.videoUrl,
          type: song.type || 'OP',
          source: 'animethemes'
        });
      }
      
      for (const anime of (animethemesResult.anime || [])) {
        for (const theme of (anime.themes || [])) {
          themes.push({
            id: theme.id,
            title: theme.title,
            anime: anime.name,
            artist: theme.artist || 'Unknown Artist',
            videoUrl: theme.videoUrl,
            type: theme.type || 'OP',
            source: 'animethemes'
          });
        }
      }
      
      console.log(`✅ AnimeThemes: ${themes.length} songs`);
    } catch (err) {
      console.error("AnimeThemes search failed:", err.message);
    }

    res.json({
      query: q,
      themes: themes,
      albums: albums
    });
  } catch (err) {
    console.error("Search failed:", err);
    res.status(502).json({ error: "Search failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
});
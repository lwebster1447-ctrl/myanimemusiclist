// backend/server.js
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import "dotenv/config";
import express from "express";
import cors from "cors";

import { searchAnimeThemes } from "./services/animethemes.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// and save it as backend/serviceAccountKey.json
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const PORT = process.env.PORT || 4000;

// Allow multiple origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "https://myanimusiclist-7f120.web.app",
  "https://myanimemusiclist.net"
];

const app = express();

// CORS configuration
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

// ===== CENSORSHIP FUNCTION =====
const CENSORED_WORDS = [
  "fuck",
  "shit",
  "cunt",
  "faggot",
  "fag",
  "nigger",
  "nigga",
  "retard",
  "tard",
  "kys",
  "chink",
  "jap"
];

function censorText(text) {
  if (!text) return text;
  let censored = text;
  const sortedWords = [...CENSORED_WORDS].sort((a, b) => b.length - a.length);
  
  for (const word of sortedWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(regex, '****');
  }
  
  censored = censored.replace(/\bkill\s+yourselves?\b/gi, '**** ******');
  censored = censored.replace(/\bend\s+your\s+life\b/gi, '*** **** ****');
  censored = censored.replace(/\bcommit\s+suicide\b/gi, '****** ********');
  censored = censored.replace(/\bend\s+it\b/gi, '*** **');
  
  return censored;
}

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

// ===== FORUM ENDPOINTS =====

// Create a forum post
app.post("/api/forum/posts", async (req, res) => {
  try {
    const { uid, username, photoURL, songTitle, animeName, content } = req.body;
    
    if (!uid || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const censoredContent = censorText(content.trim());
    
    const newPost = {
      uid,
      username: username || "Unknown",
      photoURL: photoURL || null,
      songTitle: songTitle?.trim() || "Unknown Song",
      animeName: animeName?.trim() || "Unknown Anime",
      content: censoredContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: [],
      commentCount: 0,
    };
    
    const docRef = await db.collection("forums").add(newPost);
    res.json({ id: docRef.id, ...newPost });
  } catch (error) {
    console.error("Error creating forum post:", error);
    res.status(500).json({ error: "Failed to create forum post" });
  }
});

// Update a forum post
app.put("/api/forum/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const censoredContent = censorText(content.trim());
    
    await db.collection("forums").doc(postId).update({
      content: censoredContent,
      updatedAt: new Date().toISOString(),
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating forum post:", error);
    res.status(500).json({ error: "Failed to update forum post" });
  }
});

// Add a comment
app.post("/api/forum/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { uid, username, photoURL, content } = req.body;
    
    if (!uid || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const censoredContent = censorText(content.trim());
    
    const newComment = {
      uid,
      username: username || "Unknown",
      photoURL: photoURL || null,
      content: censoredContent,
      createdAt: new Date().toISOString(),
      likes: [],
    };
    
    const commentRef = await db.collection("forums").doc(postId).collection("comments").add(newComment);
    
    // Increment comment count
    await db.collection("forums").doc(postId).update({
      commentCount: admin.firestore.FieldValue.increment(1),
    });
    
    res.json({ id: commentRef.id, ...newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ===== MIGRATION ENDPOINT (Run once to censor all existing posts and comments) =====
app.post("/api/forum/migrate", async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Simple secret to prevent accidental runs
    if (secret !== "migrate_all_content") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log("🔄 Starting migration to censor all existing content...");
    
    let postsUpdated = 0;
    let commentsUpdated = 0;
    
    // Get all forum posts
    const postsSnapshot = await db.collection("forums").get();
    
    for (const postDoc of postsSnapshot.docs) {
      const post = postDoc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Censor post content
      if (post.content) {
        const censored = censorText(post.content);
        if (censored !== post.content) {
          updates.content = censored;
          needsUpdate = true;
        }
      }
      
      // Add createdAt if missing
      if (!post.createdAt) {
        updates.createdAt = new Date().toISOString();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await postDoc.ref.update(updates);
        postsUpdated++;
        console.log(`✅ Updated post: ${postDoc.id}`);
      }
      
      // Get all comments for this post
      const commentsSnapshot = await postDoc.ref.collection("comments").get();
      
      for (const commentDoc of commentsSnapshot.docs) {
        const comment = commentDoc.data();
        let commentNeedsUpdate = false;
        const commentUpdates = {};
        
        // Censor comment content
        if (comment.content) {
          const censored = censorText(comment.content);
          if (censored !== comment.content) {
            commentUpdates.content = censored;
            commentNeedsUpdate = true;
          }
        }
        
        // Add createdAt if missing
        if (!comment.createdAt) {
          commentUpdates.createdAt = new Date().toISOString();
          commentNeedsUpdate = true;
        }
        
        if (commentNeedsUpdate) {
          await commentDoc.ref.update(commentUpdates);
          commentsUpdated++;
          console.log(`✅ Updated comment: ${commentDoc.id}`);
        }
      }
    }
    
    console.log(`🎉 Migration complete! Posts: ${postsUpdated}, Comments: ${commentsUpdated}`);
    res.json({ 
      success: true, 
      postsUpdated, 
      commentsUpdated 
    });
  } catch (error) {
    console.error("❌ Migration failed:", error);
    res.status(500).json({ error: "Migration failed" });
  }
});

app.listen(PORT, () => {
  console.log("Backend listening on http://localhost:" + PORT);
});
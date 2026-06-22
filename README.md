# MyAnimeMusicList

Search anime openings, endings, and soundtrack albums in one place, save
your favorites, and rate them. React frontend, Express backend, Firebase
for auth + your saved list.

See the full setup guide in `SETUP.md` (the doc this project was built
from) for prerequisites, Firebase configuration, troubleshooting, and
deployment instructions. The short version:

```bash
# Terminal 1
cd backend
npm install
cp .env.example .env
npm run dev          # http://localhost:4000

# Terminal 2
cd frontend
npm install
cp .env.example .env   # fill in your Firebase config first
npm run dev             # http://localhost:5173
```

Open http://localhost:5173 and search for an anime.

## Project layout

```
backend/
  server.js                 Express app, /api/search route
  services/animethemes.js   AnimeThemes API client + normalizer
  services/vgmdb.js         VGMdb (unofficial) client + normalizer
  services/cache.js         30-minute in-memory cache
frontend/
  src/firebase.js           Firebase init
  src/context/AuthContext.jsx
  src/services/api.js       Talks to OUR backend only
  src/services/library.js   Firestore reads/writes (saved songs, ratings)
  src/pages/                Search, My List, Login
firestore.rules             Copy into Firebase Console → Firestore → Rules
```

This is the original setup/reference doc this project was built from —
prerequisites, Firebase config, deployment steps, and troubleshooting.

---

1. Local setup

Prerequisites

- Node.js 18+ — download the LTS installer for your OS and run it; verify with `node -v` in a terminal
- A free GitHub account (needed later, for deploying)
- A free Firebase project

You'll run the backend and frontend at the same time in two separate
terminal windows/tabs — they're independent servers.

Firebase setup (one-time)

1. Create a project at console.firebase.google.com.
2. Authentication → Sign-in method → enable Google and Email/Password.
3. Firestore Database → Create database → start in production mode.
4. Project Settings → General → "Your apps" → add a Web app → copy the config values.
5. Firestore → Rules tab → paste the contents of `firestore.rules` (also at the repo root).

This restricts every user to their own data — nobody can read or edit
someone else's saved songs.

Backend

```bash
cd backend
npm install
cp .env.example .env       # defaults are fine for local dev
npm run dev                # http://localhost:4000
```

Frontend

```bash
cd frontend
npm install
cp .env.example .env        # fill in the Firebase values from step above
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 — search for "Naruto" and you should see
openings/endings and soundtrack albums.


2. How the pieces fit together

```
React (frontend)
   │  fetch("/api/search?q=...")
   ▼
Express (backend)
   │
   ├─▶ AnimeThemes API   (openings, endings — official, documented)
   └─▶ VGMdb (unofficial)(soundtrack albums, tracklists, composers)
```

- frontend/src/services/api.js — calls your backend, never the music APIs directly
- backend/services/animethemes.js — fetches + normalizes OPs/EDs
- backend/services/vgmdb.js — fetches + normalizes soundtrack albums
- backend/services/cache.js — 30-minute in-memory cache so repeat searches are instant and don't re-hit either upstream API
- frontend/src/services/library.js — Firestore reads/writes for saved songs & ratings


3. Data model (Firestore)

```
users/{uid}                      { username, email, createdAt }
users/{uid}/savedSongs/{songId}  { title, anime, artist, type, source, rating, addedAt }
```

Only ratings and light metadata are stored — never the full API response.
That keeps Firestore small and means if AnimeThemes/VGMdb change their data,
your saved list still works.


4. A known limitation worth knowing about

VGMdb has no official, versioned API — backend/services/vgmdb.js talks to
a community-run JSON wrapper (vgmdb.info, by hufman). It can go down or
change shape without notice. The code defensively falls back across a few
likely field names, but if album searches start returning empty results,
the first thing to check is whether vgmdb.info's response shape has
changed — open https://vgmdb.info/album/<some-id>?format=json in a
browser and compare against normalizeAlbum() in that file.


5. Troubleshooting local setup

- "Port already in use" — something else is using 4000 or 5173. Either stop that process, or change `PORT` in backend/.env (and update `VITE_API_URL` in frontend/.env to match).
- Search results never load / browser console shows a CORS error — check that `FRONTEND_ORIGIN` in backend/.env exactly matches the URL your frontend is actually running on (including http:// and the port).
- Firebase errors on sign-in — double check every `VITE_FIREBASE_*` value in frontend/.env was copied exactly from Firebase Console (no quotes, no trailing spaces).
- `npm install` fails — make sure you're on Node 18+ (`node -v`). Delete `node_modules` and `package-lock.json` in that folder and try again.


6. Deploying

You'll need this project in a GitHub repo first, since both Vercel and
Railway deploy by importing a repo (not a local folder):

```bash
cd myanimemusiclist
git init
git add .
git commit -m "Initial commit"
```

Then create a new repo on github.com and follow its "push an existing
repository" instructions to push this up.

| Piece    | Where   | Notes |
|----------|---------|-------|
| Frontend | Vercel  | "Add New Project" → import your GitHub repo. Since frontend/ and backend/ share one repo, open Settings → Root Directory and set it to `frontend`. Add the `VITE_*` env vars from your .env under Settings → Environment Variables. |
| Backend  | Railway | "New Project" → import the same repo. Set Root Directory to `backend`. Add `FRONTEND_ORIGIN` (your live Vercel URL) and `PORT` under Variables. |
| Database | Firebase | Already live once you created the project — nothing to deploy, but one extra step below. |

After deploying:

1. Update frontend/.env's `VITE_API_URL` to your live Railway URL, commit, and push — Vercel redeploys automatically.
2. Firebase Console → Authentication → Settings → Authorized domains → Add domain → paste your live Vercel URL (e.g. your-app.vercel.app). Without this, Google sign-in will fail on the deployed site even though it worked locally.


7. Where to go next

Natural next features, roughly in order of effort:

- Pagination on search results (AnimeThemes truncates at `page[size]`)
- A dedicated song detail page (currently rating happens inline in My List)
- Personal named lists beyond the single "My List" (e.g. "Top Naruto Songs") — the Firestore schema in library.js is set up to extend to a `lists` subcollection
- Artist and composer pages
- Swap the in-memory cache for Redis if you deploy multiple backend instances

// backend/services/vgmdb.js
const API_BASE = "https://vgmdb.info";

function firstOf(...candidates) {
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    if (typeof c === "string" && c.trim() === "") continue;
    return c;
  }
  return undefined;
}

function pickName(namesObj) {
  if (!namesObj || typeof namesObj !== "object") return undefined;
  return firstOf(
    namesObj.en,
    namesObj["ja-latn"],
    namesObj.ja,
    Object.values(namesObj)[0]
  );
}

function normalizeAlbum(album) {
  const title = firstOf(
    album.title,
    album.name,
    pickName(album.names),
    pickName(album.title_lang)
  );

  if (!title) return null;

  const relativeLink = firstOf(album.link, album.id && `album/${album.id}`);
  const albumUrl = relativeLink ? `https://vgmdb.net/${relativeLink}` : null;

  const composerNames = (album.composers || [])
    .map((c) => firstOf(c.name, pickName(c.names)))
    .filter(Boolean);

  // Check if it's an anime/game OST
  const categories = album.categories || [];
  const isAnime = categories.some(c => 
    c.toLowerCase().includes('anime') || 
    c.toLowerCase().includes('animation') ||
    c.toLowerCase().includes('original soundtrack')
  );

  return {
    id: `vg-${relativeLink || title}`,
    title,
    anime: firstOf(
      ...(album.products || []).map((p) => firstOf(p.name, pickName(p.names)))
    ) || null,
    artist: composerNames.join(", ") || "Various Artists",
    type: isAnime ? "Anime OST" : "Soundtrack Album",
    source: "vgmdb",
    catalogNumber: firstOf(album.catalog),
    releaseDate: firstOf(album.release_date),
    coverUrl: firstOf(album.picture_small, album.picture_full),
    albumUrl,
    tracks: (album.tracks || []).slice(0, 10).map(t => ({
      number: t.number,
      title: firstOf(t.title, pickName(t.names))
    })),
    isAnime
  };
}

// Search VGMdb
export async function searchVgmdb(query) {
  try {
    const url = `${API_BASE}/search/${encodeURIComponent(query)}?format=json`;
    console.log('📡 VGMdb search URL:', url);

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
    });

    if (!res.ok) {
      console.warn(`[VGMdb] API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const albums = firstOf(data?.results?.albums, data?.albums, []) || [];
    
    const normalized = albums.map(normalizeAlbum).filter(Boolean);
    console.log(`✅ VGMdb: Found ${normalized.length} albums`);
    return normalized;
  } catch (error) {
    console.warn("[VGMdb] Service unavailable:", error.message);
    return [];
  }
}

// Get album details by ID
export async function getAlbumDetails(albumId) {
  try {
    // albumId is like "album/1234" or just "1234"
    const cleanId = albumId.replace('album/', '');
    const url = `${API_BASE}/album/${cleanId}?format=json`;
    console.log('📡 VGMdb album URL:', url);

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
    });

    if (!res.ok) {
      console.warn(`[VGMdb] Album fetch failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return normalizeAlbum(data);
  } catch (error) {
    console.warn("[VGMdb] Album details error:", error.message);
    return null;
  }
}
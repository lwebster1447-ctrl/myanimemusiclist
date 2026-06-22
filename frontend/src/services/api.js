const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Search for openings/endings + soundtrack albums via our own backend.
 * The frontend never talks to AnimeThemes or VGMdb directly — that's the
 * backend's job (see backend/services/animethemes.js and vgmdb.js).
 * @param {string} query
 */
export async function searchSongs(query) {
  const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Search failed (${res.status})`);
  }

  return res.json(); // { query, themes, albums, warnings, cached }
}

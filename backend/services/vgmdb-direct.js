// backend/services/vgmdb-direct.js
// Direct scraper for VGMdb.net - no external API dependency

const API_BASE = "https://vgmdb.net";

// Helper to fetch HTML and parse with regex
async function fetchVgmdbPage(path) {
  const url = `${API_BASE}${path}`;
  console.log(`📡 Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  return html;
}

// Extract album info from HTML
function parseAlbumPage(html, albumId) {
  // Extract title
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Unknown Album';
  
  // Extract cover image
  const coverMatch = html.match(/<img[^>]*class="album-cover"[^>]*src="([^"]+)"/i);
  const coverUrl = coverMatch ? coverMatch[1] : null;
  
  // Extract release date
  const dateMatch = html.match(/Release Date<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  const releaseDate = dateMatch ? dateMatch[1].trim() : null;
  
  // Extract catalog number
  const catalogMatch = html.match(/Catalog #<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  const catalog = catalogMatch ? catalogMatch[1].trim() : null;
  
  // Extract composer/artist
  const composerMatch = html.match(/Composer<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  const composer = composerMatch ? composerMatch[1].trim() : 'Various';
  
  // Extract tracks
  const tracks = [];
  const trackRows = html.match(/<tr class="track[^"]*">.*?<\/tr>/gis) || [];
  
  for (const row of trackRows) {
    const cells = row.match(/<td[^>]*>([^<]*)<\/td>/g) || [];
    if (cells.length >= 2) {
      const number = cells[0].replace(/<[^>]+>/g, '').trim();
      const title = cells[1].replace(/<[^>]+>/g, '').trim();
      if (number && title && !title.includes('(not')) {
        tracks.push({ number, title });
      }
    }
  }
  
  return {
    id: albumId,
    title,
    coverUrl: coverUrl ? (coverUrl.startsWith('http') ? coverUrl : `https:${coverUrl}`) : null,
    releaseDate,
    catalog,
    artist: composer,
    tracks: tracks.slice(0, 20),
    source: 'vgmdb-direct'
  };
}

// Search for albums by query
export async function searchVgmdbDirect(query) {
  try {
    console.log(`🔍 Searching VGMdb for: "${query}"`);
    
    // Search page
    const searchUrl = `/search?do=search&type=album&q=${encodeURIComponent(query)}`;
    const html = await fetchVgmdbPage(searchUrl);
    
    // Extract album links from search results
    const albumLinks = [];
    const linkMatches = html.match(/<a[^>]*href="\/album\/(\d+)"[^>]*>/gi) || [];
    
    // Use Set to avoid duplicates
    const seen = new Set();
    for (const match of linkMatches) {
      const idMatch = match.match(/\/album\/(\d+)/);
      if (idMatch && !seen.has(idMatch[1])) {
        seen.add(idMatch[1]);
        albumLinks.push(idMatch[1]);
      }
    }
    
    console.log(`🎯 Found ${albumLinks.length} album IDs`);
    
    // Fetch details for each album
    const results = [];
    for (const albumId of albumLinks.slice(0, 5)) {
      try {
        const albumHtml = await fetchVgmdbPage(`/album/${albumId}`);
        const albumData = parseAlbumPage(albumHtml, albumId);
        
        // Check if it's anime-related
        const isAnime = albumData.title.toLowerCase().includes('anime') ||
                        albumData.title.toLowerCase().includes('ost') ||
                        albumData.title.toLowerCase().includes('soundtrack') ||
                        albumData.title.toLowerCase().includes('tv') ||
                        albumData.title.toLowerCase().includes('original');
        
        if (isAnime) {
          results.push({
            id: `vg-${albumId}`,
            title: albumData.title,
            anime: query,
            artist: albumData.artist || 'Various',
            coverUrl: albumData.coverUrl,
            catalogNumber: albumData.catalog,
            releaseDate: albumData.releaseDate,
            albumUrl: `https://vgmdb.net/album/${albumId}`,
            tracks: albumData.tracks,
            source: 'vgmdb-direct',
            type: 'Soundtrack Album'
          });
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch album ${albumId}:`, err.message);
      }
    }
    
    console.log(`✅ VGMdb direct: ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error('💥 VGMdb direct search error:', error.message);
    return [];
  }
}

// Get single album details by ID
export async function getAlbumDirect(albumId) {
  try {
    const html = await fetchVgmdbPage(`/album/${albumId}`);
    return parseAlbumPage(html, albumId);
  } catch (error) {
    console.error('💥 VGMdb album fetch error:', error.message);
    return null;
  }
}
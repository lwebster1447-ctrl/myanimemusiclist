// backend/services/animethemes.js
const API_BASE = "https://api.animethemes.moe";

// Common English to Japanese title mappings
const TITLE_MAP = {
  'attack on titan': 'shingeki no kyojin',
  'aot': 'shingeki no kyojin',
  're:zero': 're:zero kara hajimeru isekai seikatsu',
  'rezero': 're:zero kara hajimeru isekai seikatsu',
  'demon slayer': 'kimetsu no yaiba',
  'jujutsu kaisen': 'jujutsu kaisen',
  'my hero academia': 'boku no hero academia',
  'one punch man': 'one punch man',
  'opm': 'one punch man',
  'sword art online': 'sao',
  'sao': 'sao',
  'no game no life': 'no game no life',
  'fullmetal alchemist': 'hagane no renkinjutsushi',
  'fma': 'hagane no renkinjutsushi',
  'tokyo ghoul': 'tokyo ghoul',
  'steins;gate': 'steins gate',
  'naruto': 'naruto',
  'naruto shippuden': 'naruto shippuuden',
  'bleach': 'bleach',
  'one piece': 'one piece',
  'hunter x hunter': 'hunter x hunter',
  'hxh': 'hunter x hunter',
  'fate/stay night': 'fate stay night',
  'fate': 'fate',
  'gundam': 'gundam',
  'evangelion': 'evangelion',
  'cowboy bebop': 'cowboy bebop',
  'konosuba': 'konosuba',
  'overlord': 'overlord',
  'mushoku tensei': 'mushoku tensei',
  'vinland saga': 'vinland saga',
  'berserk': 'berserk',
  'made in abyss': 'made in abyss',
};

function getSearchTerms(query) {
  const lower = query.toLowerCase().trim();
  const mapped = TITLE_MAP[lower];
  if (mapped) {
    console.log(`📝 Mapping "${query}" → "${mapped}"`);
    return [query, mapped];
  }
  return [query];
}

export async function searchAnimeThemes(query) {
  console.log('🔍 Searching:', query);
  
  if (!query || !query.trim()) {
    return { songs: [], artists: [], anime: [] };
  }

  const cleanQuery = query.trim();
  const cleanQueryLower = cleanQuery.toLowerCase();
  const searchTerms = getSearchTerms(cleanQuery);
  
  const result = { songs: [], artists: [], anime: [] };
  const seenIds = new Set();

  const addAnime = (anime) => {
    if (!anime || seenIds.has(`anime-${anime.id}`)) return;
    seenIds.add(`anime-${anime.id}`);
    
    const themes = anime.animethemes || [];
    const themeData = themes.map(theme => {
      const song = theme.song || {};
      const entries = theme.animethemeentries || [];
      const firstEntry = entries[0];
      const videos = firstEntry?.videos || [];
      const firstVideo = videos[0];
      return {
        id: `theme-${theme.id}`,
        title: song.title || `${theme.type}${theme.sequence || ''}`,
        type: theme.type || 'OP',
        sequence: theme.sequence || null,
        videoUrl: firstVideo?.link || null,
        artist: (song.artists || []).map(a => a.name).filter(Boolean).join(', ') || 'Unknown Artist'
      };
    });
    
    result.anime.push({
      id: `anime-${anime.id}`,
      name: anime.name || 'Unknown Anime',
      slug: anime.slug || '',
      themes: themeData,
      source: 'animethemes'
    });
  };

  // Try each search term
  for (const term of searchTerms) {
    try {
      const url = new URL(`${API_BASE}/search`);
      url.searchParams.set('q', term);
      url.searchParams.set('include[anime]', 'animethemes.animethemeentries.videos,animethemes.song.artists');
      url.searchParams.set('limit', '30');
      
      console.log(`📡 Searching with: "${term}"`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      const searchData = data.search || {};
      let animeMatches = searchData.anime || [];
      
      // FILTER: Only keep anime that START WITH the query (no fuzzy matches)
      const filteredAnime = animeMatches.filter(a => {
        const animeName = (a.name || '').toLowerCase();
        // Check if it starts with the query OR starts with the mapped term
        return animeName.startsWith(cleanQueryLower) ||
               (searchTerms.length > 1 && animeName.startsWith(searchTerms[1].toLowerCase()));
      });
      
      console.log(`📺 Found ${filteredAnime.length} matching anime for "${term}" (filtered from ${animeMatches.length})`);

      for (const anime of filteredAnime) {
        addAnime(anime);
      }

      // If we found anime, stop searching
      if (result.anime.length > 0) {
        console.log(`✅ Found ${result.anime.length} anime, stopping search`);
        break;
      }

    } catch (error) {
      console.error(`💥 Error:`, error.message);
    }
  }

  console.log(`✅ FINAL: ${result.anime.length} anime`);
  return result;
}
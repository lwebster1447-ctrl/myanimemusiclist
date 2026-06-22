// backend/services/musicbrainz.js
const API_BASE = "https://musicbrainz.org/ws/2";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Search for individual OST tracks
export async function searchMusicBrainzTracks(query) {
  try {
    console.log(`🔍 Searching MusicBrainz for OST tracks: "${query}"`);
    
    // Search for releases (albums) that match the query
    const searchQuery = `${query} AND (anime OR soundtrack OR ost)`;
    const url = `${API_BASE}/release/?query=${encodeURIComponent(searchQuery)}&fmt=json&limit=10`;
    
    console.log(`📡 MusicBrainz URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MyAnimeMusicList/1.0 (contact@example.com)'
      }
    });

    if (!response.ok) {
      console.warn(`MusicBrainz API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const releases = data.releases || [];
    
    console.log(`✅ Found ${releases.length} releases, fetching tracks...`);

    const allTracks = [];

    // For each release, get the tracklist
    for (const release of releases) {
      try {
        const releaseTitle = release.title || '';
        
        // Skip if not relevant to the search
        const isRelevant = releaseTitle.toLowerCase().includes(query.toLowerCase()) ||
                          releaseTitle.toLowerCase().includes('soundtrack') ||
                          releaseTitle.toLowerCase().includes('ost') ||
                          releaseTitle.toLowerCase().includes('original');
        
        if (!isRelevant) continue;

        // Get album details with tracks
        await delay(500);
        const detailUrl = `${API_BASE}/release/${release.id}?fmt=json&inc=recordings+artists+labels`;
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'User-Agent': 'MyAnimeMusicList/1.0 (contact@example.com)'
          }
        });

        if (!detailResponse.ok) continue;

        const detailData = await detailResponse.json();
        
        // Get album artists
        const albumArtists = (detailData['artist-credit'] || [])
          .filter(item => item.artist)
          .map(item => item.artist.name)
          .filter(Boolean);

        // Extract each track as a separate song
        const tracks = (detailData.media || []).flatMap(media => 
          (media.tracks || []).map(track => {
            // Get track-specific artists if available
            const trackArtists = (track['artist-credit'] || [])
              .filter(item => item.artist)
              .map(item => item.artist.name)
              .filter(Boolean);

            return {
              id: `mb-track-${release.id}-${track.number || Math.random()}`,
              title: track.title || 'Unknown Track',
              anime: query,
              artist: trackArtists.join(', ') || albumArtists.join(', ') || 'Various Artists',
              album: detailData.title || 'Unknown Album',
              type: 'OST',
              trackNumber: track.number,
              source: 'musicbrainz',
              videoUrl: null,
              coverUrl: `https://coverartarchive.org/release/${detailData.id}/front`,
              albumUrl: `https://musicbrainz.org/release/${detailData.id}`,
              releaseDate: detailData.date || null,
              // Add sequence for badge display
              sequence: track.number ? parseInt(track.number) : null
            };
          })
        );

        allTracks.push(...tracks);
        
      } catch (err) {
        console.warn(`Failed to fetch tracks for release ${release.id}:`, err.message);
      }
    }

    console.log(`✅ MusicBrainz: Found ${allTracks.length} individual OST tracks`);
    return allTracks;

  } catch (error) {
    console.error('💥 MusicBrainz search error:', error.message);
    return [];
  }
}

// Keep the original functions for compatibility
export async function searchMusicBrainz(query) {
  return searchMusicBrainzTracks(query);
}

export async function getAlbumDetails(mbid) {
  try {
    await delay(1000);
    
    const url = `${API_BASE}/release/${mbid}?fmt=json&inc=recordings+artists+labels`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MyAnimeMusicList/1.0 (contact@example.com)'
      }
    });

    if (!response.ok) {
      console.warn(`MusicBrainz album fetch error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    const tracks = (data.media || []).flatMap(media => 
      (media.tracks || []).map(track => ({
        number: track.number,
        title: track.title,
        length: track.length ? Math.round(track.length / 1000) : null
      }))
    );

    const artists = (data['artist-credit'] || [])
      .filter(item => item.artist)
      .map(item => item.artist.name)
      .filter(Boolean);

    return {
      id: data.id,
      title: data.title,
      artist: artists.join(', ') || 'Various Artists',
      releaseDate: data.date || null,
      tracks: tracks,
      coverUrl: `https://coverartarchive.org/release/${data.id}/front`,
      source: 'musicbrainz'
    };
    
  } catch (error) {
    console.error('💥 MusicBrainz album details error:', error.message);
    return null;
  }
}

export function normalizeMusicBrainzRelease(release, query) {
  // This is now handled by searchMusicBrainzTracks
  return null;
}
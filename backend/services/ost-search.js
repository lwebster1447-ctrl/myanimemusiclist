// backend/services/ost-search.js
// Uses a different proxy that's more reliable

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchAnimeOST(query) {
  try {
    console.log(`🔍 Searching MusicBrainz for OSTs: "${query}"`);
    
    const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    if (!cleanQuery) return [];
    
    // Try different proxies
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(cleanQuery)}&fmt=json&limit=20`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(cleanQuery)}&fmt=json&limit=20`)}`,
      `https://cors-anywhere.herokuapp.com/https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(cleanQuery)}&fmt=json&limit=20`
    ];
    
    let data = null;
    let usedProxy = 0;
    
    for (let i = 0; i < proxies.length; i++) {
      try {
        console.log(`📡 Trying proxy ${i + 1}...`);
        const response = await fetch(proxies[i], {
          headers: {
            'User-Agent': 'MyAnimeMusicList/1.0 (contact@example.com)'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          data = await response.json();
          usedProxy = i + 1;
          console.log(`✅ Proxy ${usedProxy} worked`);
          break;
        }
      } catch (err) {
        console.log(`❌ Proxy ${i + 1} failed:`, err.message);
      }
    }
    
    if (!data) {
      console.warn('All proxies failed');
      return [];
    }

    const releases = data.releases || [];
    console.log(`✅ Found ${releases.length} releases`);

    const allTracks = [];

    for (const release of releases) {
      try {
        const title = release.title || '';
        
        const isAnime = title.toLowerCase().includes('anime') ||
                       title.toLowerCase().includes('ost') ||
                       title.toLowerCase().includes('soundtrack') ||
                       title.toLowerCase().includes('original');
        
        if (!isAnime) continue;

        await delay(500);
        
        // Use the same proxy for details
        const detailProxy = proxies[usedProxy - 1].split('?')[0] + '?';
        const detailUrl = `${detailProxy}${encodeURIComponent(`https://musicbrainz.org/ws/2/release/${release.id}?fmt=json&inc=recordings+artists`)}`;
        
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'User-Agent': 'MyAnimeMusicList/1.0 (contact@example.com)'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!detailResponse.ok) continue;

        const detailData = await detailResponse.json();
        
        const albumArtists = (detailData['artist-credit'] || [])
          .filter(item => item.artist)
          .map(item => item.artist.name)
          .filter(Boolean);

        const tracks = (detailData.media || []).flatMap(media => 
          (media.tracks || []).map(track => {
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
              coverUrl: null,
              albumUrl: `https://musicbrainz.org/release/${release.id}`,
              sequence: track.number ? parseInt(track.number) : null
            };
          })
        );

        allTracks.push(...tracks);
        console.log(`✅ Added ${tracks.length} tracks from "${detailData.title}"`);
        
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
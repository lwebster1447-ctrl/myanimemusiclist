// frontend/src/pages/SearchPage.jsx
import { useState, useEffect } from "react";
import { searchSongs } from "../services/api.js";
import { saveSong, subscribeSavedSongs } from "../services/library.js";
import { useAuth } from "../context/AuthContext.jsx";
import SongCard from "../components/SongCard.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";

export default function SearchPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [filterText, setFilterText] = useState("");
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedIds, setSavedIds] = useState(new Set());
  const [videoPlayer, setVideoPlayer] = useState(null);

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    
    const unsubscribe = subscribeSavedSongs(user.uid, (songs) => {
      const ids = new Set(songs.map(song => song.id));
      setSavedIds(ids);
    });
    
    return unsubscribe;
  }, [user]);

  async function runSearch(term) {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults(null);
      setStatus("idle");
      setFilterText("");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setFilterText("");

    try {
      const data = await searchSongs(trimmed);
      console.log('🔍 Full search results:', data);
      setResults(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(q);
  }

  const handleClearSearch = () => {
    setQ("");
    setResults(null);
    setStatus("idle");
    setFilterText("");
  };

  async function handleSave(song) {
    if (!user) return;
    await saveSong(user.uid, song);
  }

  const handlePlayVideo = (song) => {
    if (song.videoUrl) {
      setVideoPlayer({
        videoUrl: song.videoUrl,
        title: `${song.title} - ${song.anime}`
      });
    }
  };

  const handleCloseVideo = () => {
    setVideoPlayer(null);
  };

  const themes = results?.themes || [];
  const albums = results?.albums || [];

  const filteredThemes = themes.filter((theme) => {
    if (!filterText.trim()) return true;
    const filterLower = filterText.toLowerCase().trim();
    const title = (theme.title || '').toLowerCase();
    const artist = (theme.artist || '').toLowerCase();
    const anime = (theme.anime || '').toLowerCase();
    return title.includes(filterLower) || 
           artist.includes(filterLower) || 
           anime.includes(filterLower);
  });

  const openings = filteredThemes.filter((t) => t.type === "OP");
  const endings = filteredThemes.filter((t) => t.type === "ED");
  const otherThemes = filteredThemes.filter((t) => t.type !== "OP" && t.type !== "ED");

  const totalResults = filteredThemes.length;
  const hasFilter = filterText.trim().length > 0;

  // Check if any results have missing data
  const hasMissingData = results && filteredThemes.some(song => 
    !song.artist || song.artist === "Unknown Artist" || 
    !song.anime || song.anime === "Unknown Anime" ||
    !song.title || song.title === "Unknown Title"
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Find an opening or ending</h1>
        <p>Search by anime title — results come from AnimeThemes.</p>
        <p className="search-hint-inline">
          💡 If the English name shows no results, try Japanese romaji 
          <span className="hint-example"> (e.g., "Shingeki no Kyojin" for "Attack on Titan")</span>
        </p>
        {results && filteredThemes.length === 0 && albums.length === 0 && status === "idle" && (
          <div className="banner warn" style={{ marginTop: "12px" }}>
            <p style={{ margin: 0 }}>
              <strong>We sincerely apologise!</strong> No results found for "{results.query}". 
              Try a different spelling, or the English vs. romaji title.
            </p>
          </div>
        )}
        {results && filteredThemes.length > 0 && hasMissingData && (
          <div className="banner warn" style={{ marginTop: "12px" }}>
            <p style={{ margin: 0 }}>
              <strong>We sincerely apologise!</strong> Some results may be missing data (e.g., Unknown Artist). 
              We're working to improve this. If this affects you, please try another search, check back later, 
              or submit a website improvement submission via the form in the footer!
            </p>
          </div>
        )}
      </div>

      <form className="search-bar" onSubmit={handleSubmit}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="search"
            placeholder='Try "Naruto" or "Re:zero"'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: '100%', paddingRight: q ? '36px' : '12px' }}
          />
          {q && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              ✕
            </button>
          )}
        </div>
        <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      {results && themes.length > 0 && (
        <div className="filter-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="🔍 Filter songs by name or artist..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          {hasFilter && (
            <span className="filter-count">
              {totalResults} {totalResults === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>
      )}

      {!user && (
        <div className="banner warn">
          You're browsing without an account — sign in to save songs to your list.
        </div>
      )}

      {status === "error" && <div className="banner error">{errorMsg}</div>}

      {status === "idle" && results === null && (
        <div className="state-block">
          <h3>Nothing searched yet</h3>
          <p>Type an anime title above to look up music rows.</p>
        </div>
      )}

      {results && filteredThemes.length === 0 && albums.length === 0 && status === "idle" && (
        <div className="state-block">
          <h3>No results for "{results.query}"</h3>
          <p>Try a different spelling, or the English vs. romaji title.</p>
        </div>
      )}

      {openings.length > 0 && (
        <>
          <h2 className="section-title">Openings</h2>
          <div className="card-list">
            {openings.map((song) => (
              <SongCard key={song.id} song={song} onPlayVideo={handlePlayVideo}>
                <SaveButton
                  song={song}
                  user={user}
                  saved={savedIds.has(song.id)}
                  onSave={handleSave}
                />
              </SongCard>
            ))}
          </div>
        </>
      )}

      {endings.length > 0 && (
        <>
          <h2 className="section-title">Endings</h2>
          <div className="card-list">
            {endings.map((song) => (
              <SongCard key={song.id} song={song} onPlayVideo={handlePlayVideo}>
                <SaveButton
                  song={song}
                  user={user}
                  saved={savedIds.has(song.id)}
                  onSave={handleSave}
                />
              </SongCard>
            ))}
          </div>
        </>
      )}

      {otherThemes.length > 0 && (
        <>
          <h2 className="section-title">Other Songs</h2>
          <div className="card-list">
            {otherThemes.map((song) => (
              <SongCard key={song.id} song={song} onPlayVideo={handlePlayVideo}>
                <SaveButton
                  song={song}
                  user={user}
                  saved={savedIds.has(song.id)}
                  onSave={handleSave}
                />
              </SongCard>
            ))}
          </div>
        </>
      )}

      {albums.length > 0 && (
        <>
          <h2 className="section-title">Soundtrack Albums</h2>
          <div className="card-list">
            {albums.map((album) => (
              <SongCard key={album.id} song={album} onPlayVideo={handlePlayVideo}>
                <SaveButton
                  song={album}
                  user={user}
                  saved={savedIds.has(album.id)}
                  onSave={handleSave}
                />
              </SongCard>
            ))}
          </div>
        </>
      )}

      {videoPlayer && (
        <VideoPlayer 
          videoUrl={videoPlayer.videoUrl}
          title={videoPlayer.title}
          onClose={handleCloseVideo}
        />
      )}
    </div>
  );
}

function SaveButton({ song, user, saved, onSave }) {
  if (!user) return null;
  return (
    <button
      className="btn btn-sm"
      disabled={saved}
      onClick={() => onSave(song)}
      title={saved ? "Already in My List" : "Save to My List"}
    >
      {saved ? "Saved ✓" : "Save"}
    </button>
  );
}
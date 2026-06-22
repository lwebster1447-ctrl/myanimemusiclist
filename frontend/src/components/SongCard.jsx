// frontend/src/components/SongCard.jsx
function badgeClass(type) {
  if (type === "OP") return "op";
  if (type === "ED") return "ed";
  if (type === "OST") return "ost";
  return "album";
}

function badgeLabel(song) {
  if (song.type === "OP" || song.type === "ED") {
    return `${song.type}${song.sequence ?? ""}`;
  }
  if (song.type === "OST") {
    return "OST";
  }
  return "Album";
}

function searchYouTube(title, artist, anime) {
  const query = `${title} ${artist} ${anime}`.trim();
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  window.open(url, '_blank');
}

export default function SongCard({ song, children, onPlayVideo }) {
  const subtitle = [song.anime, song.artist].filter(Boolean).join(" — ");
  
  const handleTitleClick = () => {
    // If onPlayVideo is provided, always use the overlay (for MyList and UserMyList pages)
    if (onPlayVideo) {
      onPlayVideo(song);
      return;
    }
    
    // Otherwise, use the original behavior (for Search page)
    if (song.videoUrl) {
      window.open(song.videoUrl, '_blank');
    } else if (song.albumUrl) {
      window.open(song.albumUrl, '_blank');
    } else {
      searchYouTube(song.title, song.artist, song.anime);
    }
  };

  return (
    <div className="song-card">
      <span className={`seq-badge ${badgeClass(song.type)}`}>{badgeLabel(song)}</span>

      <div className="song-card-main">
        <button
          className="song-card-title song-clickable"
          onClick={handleTitleClick}
          style={{ 
            display: "block", 
            background: "none", 
            border: "none", 
            color: "inherit",
            cursor: "pointer",
            textAlign: "left",
            padding: 0,
            fontSize: "inherit",
            fontFamily: "inherit",
            fontWeight: 600,
            width: "100%"
          }}
        >
          {song.title}
          <span className="play-hint"> ▶</span>
        </button>
        <p className="song-card-sub">{subtitle}</p>
      </div>

      <div className="song-card-actions">{children}</div>
    </div>
  );
}
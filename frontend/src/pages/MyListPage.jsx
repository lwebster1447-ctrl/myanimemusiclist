// frontend/src/pages/MyListPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { removeSong, setRating, subscribeSavedSongs } from "../services/library.js";
import SongCard from "../components/SongCard.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";

// MyAnimeList style rating labels
const RATING_LABELS = {
  10: "10 - Masterpiece",
  9: "9 - Great",
  8: "8 - Very Good",
  7: "7 - Good",
  6: "6 - Fine",
  5: "5 - Average",
  4: "4 - Bad",
  3: "3 - Very Bad",
  2: "2 - Horrible",
  1: "1 - Appalling"
};

const RATING_OPTIONS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function MyListPage() {
  const { user, userProfile, toggleFavoriteSong } = useAuth();
  const [songs, setSongs] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [addError, setAddError] = useState("");
  const [showError, setShowError] = useState(false);
  const [localRatings, setLocalRatings] = useState({});
  const [videoPlayer, setVideoPlayer] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeSavedSongs(user.uid, (updatedSongs) => {
      setSongs(updatedSongs);
      const ratings = {};
      updatedSongs.forEach(s => { ratings[s.id] = s.rating || 0; });
      setLocalRatings(ratings);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (userProfile?.favoriteSongs) {
      setFavoriteIds(new Set(userProfile.favoriteSongs.map(s => s.songId)));
    }
  }, [userProfile]);

  const handleAddToFavorites = async (song) => {
    try {
      setAddError("");
      const rating = localRatings[song.id] || 0;
      console.log('⭐ Adding to favorites - Song:', song.title, 'Rating:', rating);
      await toggleFavoriteSong(song, rating);
    } catch (err) {
      setAddError(err.message);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleRatingChange = async (songId, value) => {
    if (!user) return;
    setLocalRatings(prev => ({ ...prev, [songId]: value }));
    await setRating(user.uid, songId, value);
    
    if (favoriteIds.has(songId)) {
      const song = songs.find(s => s.id === songId);
      if (song) {
        await toggleFavoriteSong(song, value);
      }
    }
  };

  // ✅ ALWAYS use the overlay - NEVER open a new tab
  const handlePlayVideo = (song) => {
    console.log('🎬 Playing video for:', song.title, 'videoUrl:', song.videoUrl);
    setVideoPlayer({
      videoUrl: song.videoUrl || null,
      title: `${song.title} - ${song.anime}`
    });
  };

  const handleCloseVideo = () => {
    setVideoPlayer(null);
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My List</h1>
        <p>Songs and albums you've saved, with your ratings.</p>
        {userProfile?.favoriteSongs?.length >= 10 && (
          <p style={{ color: "var(--accent)", fontSize: "13px" }}>
            ⭐ You've reached the maximum of 10 favorite songs!
          </p>
        )}
      </div>

      {showError && (
        <div className="banner error">
          {addError || "Maximum of 10 favorite songs reached!"}
        </div>
      )}

      {songs === null && <div className="state-block">Loading your list…</div>}

      {songs?.length === 0 && (
        <div className="state-block">
          <h3>Your list is empty</h3>
          <p>Head to Search and save an opening, ending, or OST to get started.</p>
        </div>
      )}

      {songs?.length > 0 && (
        <div className="card-list">
          {songs.map((song) => {
            const isFavorite = favoriteIds.has(song.id);
            const isMaxFavorites = userProfile?.favoriteSongs?.length >= 10;
            const currentRating = localRatings[song.id] || song.rating || 0;
            
            return (
              <SongCard key={song.id} song={song} onPlayVideo={handlePlayVideo}>
                <div className="rating-dropdown">
                  <select
                    value={currentRating}
                    onChange={(e) => handleRatingChange(song.id, parseInt(e.target.value))}
                    className="rating-select"
                  >
                    <option value="0" disabled>— Rate —</option>
                    {RATING_OPTIONS.map((num) => (
                      <option key={num} value={num}>
                        {RATING_LABELS[num]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className={`btn btn-sm ${isFavorite ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => handleAddToFavorites(song)}
                  disabled={!isFavorite && isMaxFavorites}
                  title={isFavorite ? "Added to favorites" : "Add to Top 10 favorites"}
                >
                  {isFavorite ? "⭐ Favorited" : "⭐ Add to Profile"}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => removeSong(user.uid, song.id)}
                  title="Remove from My List"
                >
                  Remove
                </button>
              </SongCard>
            );
          })}
        </div>
      )}

      {/* Video Player Overlay */}
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
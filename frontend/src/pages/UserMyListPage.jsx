// frontend/src/pages/UserMyListPage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase.js";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
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

const RATING_COLORS = {
  10: "#ff2d8a",
  9: "#a855f7",
  8: "#3b82f6",
  7: "#60a5fa",
  6: "#22c55e",
  5: "#84cc16",
  4: "#eab308",
  3: "#f97316",
  2: "#92400e",
  1: "#ef4444"
};

export default function UserMyListPage() {
  const { username } = useParams();
  const { getUserByUsername } = useAuth();
  const [targetUser, setTargetUser] = useState(null);
  const [songs, setSongs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoPlayer, setVideoPlayer] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const userData = await getUserByUsername(username);
      if (userData) {
        setTargetUser(userData);
        await loadUserSongs(userData.uid);
      }
      setLoading(false);
    }
    loadUser();
  }, [username]);

  const loadUserSongs = async (uid) => {
    try {
      const songsRef = collection(db, "users", uid, "savedSongs");
      const q = query(songsRef, orderBy("addedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedSongs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSongs(fetchedSongs);
    } catch (error) {
      console.error("Error loading user songs:", error);
      setSongs([]);
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

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>User not found</h3>
          <p>The user "{username}" doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getRatingDisplay = (rating) => {
    if (!rating || rating === 0) return null;
    return {
      label: RATING_LABELS[rating] || `${rating}/10`,
      color: RATING_COLORS[rating] || "var(--text-muted)"
    };
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>@{targetUser.username}'s List</h1>
        <p>Songs and albums saved by {targetUser.username}.</p>
      </div>

      {songs === null && <div className="state-block">Loading...</div>}

      {songs?.length === 0 && (
        <div className="state-block">
          <h3>This list is empty</h3>
          <p>{targetUser.username} hasn't saved any songs yet.</p>
        </div>
      )}

      {songs?.length > 0 && (
        <div className="card-list">
          {songs.map((song) => {
            const ratingInfo = getRatingDisplay(song.rating);
            return (
              <SongCard key={song.id} song={song} onPlayVideo={handlePlayVideo}>
                {ratingInfo && (
                  <div className="song-rating">
                    <span 
                      className="rating-badge" 
                      style={{ 
                        backgroundColor: `${ratingInfo.color}22`,
                        color: ratingInfo.color,
                        border: `1px solid ${ratingInfo.color}33`
                      }}
                    >
                      {ratingInfo.label}
                    </span>
                  </div>
                )}
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
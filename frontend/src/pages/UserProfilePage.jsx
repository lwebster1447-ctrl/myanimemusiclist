// frontend/src/pages/UserProfilePage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ProfilePicture from "../components/ProfilePicture.jsx";

const RATING_LABELS = {
  10: { label: "10 - Masterpiece", color: "#ff2d8a" },
  9: { label: "9 - Great", color: "#a855f7" },
  8: { label: "8 - Very Good", color: "#3b82f6" },
  7: { label: "7 - Good", color: "#60a5fa" },
  6: { label: "6 - Fine", color: "#22c55e" },
  5: { label: "5 - Average", color: "#84cc16" },
  4: { label: "4 - Bad", color: "#eab308" },
  3: { label: "3 - Very Bad", color: "#f97316" },
  2: { label: "2 - Horrible", color: "#92400e" },
  1: { label: "1 - Appalling", color: "#ef4444" }
};

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

export default function UserProfilePage() {
  const { username } = useParams();
  const { user, userProfile, toggleFollow, getUserByUsername, getUserById } = useAuth();
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isFollowingState, setIsFollowingState] = useState(false);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const userData = await getUserByUsername(username);
      if (userData) {
        setTargetUser(userData);
        setIsFollowingState(userProfile?.following?.includes(userData.uid) || false);
        await fetchUsersDetails(userData);
      }
      setLoading(false);
    }
    loadUser();
  }, [username, userProfile]);

  const fetchUsersDetails = async (userData) => {
    if (!userData) return;
    
    const followerPromises = (userData.followers || []).map(async (uid) => {
      const userData = await getUserById(uid);
      return userData;
    });
    
    const followingPromises = (userData.following || []).map(async (uid) => {
      const userData = await getUserById(uid);
      return userData;
    });
    
    const followers = await Promise.all(followerPromises);
    const following = await Promise.all(followingPromises);
    
    setFollowersList(followers.filter(Boolean));
    setFollowingList(following.filter(Boolean));
  };

  const handleFollowToggle = async () => {
    if (!targetUser || !user) return;
    try {
      await toggleFollow(targetUser.uid);
      // Update the follow state immediately
      setIsFollowingState(!isFollowingState);
      // Refresh the target user data after follow/unfollow
      const updatedUser = await getUserById(targetUser.uid);
      if (updatedUser) {
        setTargetUser(updatedUser);
        await fetchUsersDetails(updatedUser);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>Loading profile...</h3>
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

  const isOwnProfile = user?.uid === targetUser.uid;

  return (
    <div className="page">
      <div className="profile-header">
        <ProfilePicture 
          username={targetUser.username}
          photoURL={targetUser.photoURL}
          isOwner={false}
          size="large"
        />
        
        <div className="profile-info">
          <h1 style={{ margin: 0 }}>@{targetUser.username}</h1>
          
          <div className="profile-stats">
            <button 
              className="stat-btn"
              onClick={() => setShowFollowers(!showFollowers)}
            >
              <span className="stat-number">{targetUser.followers?.length || 0}</span>
              <span className="stat-label">Followers</span>
            </button>
            <button 
              className="stat-btn"
              onClick={() => setShowFollowing(!showFollowing)}
            >
              <span className="stat-number">{targetUser.following?.length || 0}</span>
              <span className="stat-label">Following</span>
            </button>
            <div className="stat">
              <span className="stat-number">{targetUser.favoriteSongs?.length || 0}</span>
              <span className="stat-label">Favorites</span>
            </div>
          </div>

          {targetUser.currentFavorite && (
            <div className="current-favorite-display" style={{ marginTop: "8px" }}>
              <span className="current-favorite-label">⭐ Current Favorite:</span>
              <span className="current-favorite-song">{targetUser.currentFavorite.title}</span>
              <span className="current-favorite-anime">({targetUser.currentFavorite.anime})</span>
            </div>
          )}

          {!isOwnProfile && user && (
            <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className={`btn ${isFollowingState ? "btn-ghost" : "btn-primary"}`}
                onClick={handleFollowToggle}
              >
                {isFollowingState ? "Unfollow" : "Follow"}
              </button>
              <Link to={`/user/${targetUser.username}/my-list`} className="btn">
                View My List
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Followers Popup */}
      {showFollowers && (
        <div className="popup-overlay" onClick={() => setShowFollowers(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Followers</h3>
            <button className="popup-close" onClick={() => setShowFollowers(false)}>×</button>
            <div className="user-list">
              {followersList.length > 0 ? (
                followersList.map(f => (
                  <Link 
                    key={f.uid} 
                    to={`/user/${f.username}`} 
                    className="user-list-item" 
                    onClick={() => setShowFollowers(false)}
                  >
                    @{f.username}
                  </Link>
                ))
              ) : (
                <p className="text-muted">No followers yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Popup */}
      {showFollowing && (
        <div className="popup-overlay" onClick={() => setShowFollowing(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Following</h3>
            <button className="popup-close" onClick={() => setShowFollowing(false)}>×</button>
            <div className="user-list">
              {followingList.length > 0 ? (
                followingList.map(f => (
                  <Link 
                    key={f.uid} 
                    to={`/user/${f.username}`} 
                    className="user-list-item" 
                    onClick={() => setShowFollowing(false)}
                  >
                    @{f.username}
                  </Link>
                ))
              ) : (
                <p className="text-muted">Not following anyone yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="profile-bio">
        <p>{targetUser.bio || "No bio yet."}</p>
      </div>

      <div className="profile-favorites">
        <h2 className="section-title">⭐ Top 10 Favorite OP/EDs</h2>
        
        {targetUser.favoriteSongs?.length > 0 ? (
          <div className="card-list">
            {targetUser.favoriteSongs.slice(0, 10).map((song, index) => {
              const rating = song.rating || 0;
              const ratingInfo = rating > 0 ? RATING_LABELS[rating] : null;
              
              return (
                <div key={song.songId} className="song-card favorite-song">
                  <span className="favorite-rank">#{index + 1}</span>
                  <span className={`seq-badge ${badgeClass(song.type)}`}>
                    {badgeLabel(song)}
                  </span>
                  <div className="song-card-main">
                    <div className="song-card-title">{song.title}</div>
                    <div className="song-card-sub">
                      {song.anime} • {song.artist}
                    </div>
                  </div>
                  {ratingInfo ? (
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
                  ) : (
                    <div className="song-rating">
                      <span className="rating-badge" style={{ color: "var(--text-muted)" }}>Not rated</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="state-block">
            <p className="text-muted">No favorite OP/EDs yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
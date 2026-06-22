// frontend/src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ProfilePicture from "../components/ProfilePicture.jsx";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// MyAnimeList style rating labels with colors
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

// Sortable Song Item component
function SortableSongItem({ song, displayIndex, ratingInfo, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.songId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: isDragging ? 'var(--accent)' : undefined,
    boxShadow: isDragging ? '0 0 30px rgba(255,45,138,0.15)' : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove(song.songId);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`song-card favorite-song ${isDragging ? 'dragging' : ''}`}
    >
      <div {...attributes} {...listeners} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <span className="favorite-rank">#{displayIndex}</span>
        <span className={`seq-badge ${badgeClass(song.type)}`}>
          {badgeLabel(song)}
        </span>
        <span className="drag-handle" style={{ color: 'var(--text-muted)', fontSize: '18px', cursor: 'grab' }}>
          ⋮⋮
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
      <button 
        className="btn btn-sm btn-ghost"
        onClick={handleRemoveClick}
        style={{ flexShrink: 0 }}
      >
        Remove
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, updateProfilePhoto, toggleFollow, getUserById, checkUsernameTaken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [bio, setBio] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [currentFavorite, setCurrentFavorite] = useState(null);
  const [showFavoritePicker, setShowFavoritePicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (userProfile) {
      setBio(userProfile.bio || "");
      setNewUsername(userProfile.username || "");
      setFavorites(userProfile.favoriteSongs || []);
      setCurrentFavorite(userProfile.currentFavorite || null);
      fetchUsersDetails();
    }
  }, [userProfile]);

  const fetchUsersDetails = async () => {
    if (!userProfile) return;
    
    const followerPromises = (userProfile.followers || []).map(async (uid) => {
      const userData = await getUserById(uid);
      return userData;
    });
    
    const followingPromises = (userProfile.following || []).map(async (uid) => {
      const userData = await getUserById(uid);
      return userData;
    });
    
    const followers = await Promise.all(followerPromises);
    const following = await Promise.all(followingPromises);
    
    setFollowersList(followers.filter(Boolean));
    setFollowingList(following.filter(Boolean));
  };

  const handleSaveBio = async () => {
    setLoading(true);
    await updateUserProfile({ bio });
    setLoading(false);
    setIsEditing(false);
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    
    const usernameTaken = await checkUsernameTaken(newUsername.trim());
    if (usernameTaken) {
      setUsernameError("Username already taken. Please choose another.");
      return;
    }
    
    setUsernameError("");
    setLoading(true);
    await updateUserProfile({ username: newUsername.trim() });
    setLoading(false);
    setIsEditingUsername(false);
  };

  const handleRemoveFavorite = async (songId) => {
    const updatedFavorites = favorites.filter(s => s.songId !== songId);
    setFavorites(updatedFavorites);
    await updateUserProfile({ favoriteSongs: updatedFavorites });
  };

  const handleSetCurrentFavorite = async (song) => {
    setCurrentFavorite(song);
    await updateUserProfile({ currentFavorite: song });
    setShowFavoritePicker(false);
  };

  const handleRemoveCurrentFavorite = async () => {
    setCurrentFavorite(null);
    await updateUserProfile({ currentFavorite: null });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = favorites.findIndex((item) => item.songId === active.id);
      const newIndex = favorites.findIndex((item) => item.songId === over.id);
      
      const newFavorites = arrayMove(favorites, oldIndex, newIndex);
      setFavorites(newFavorites);
      await updateUserProfile({ favoriteSongs: newFavorites });
    }
  };

  const displayedFavorites = favorites.slice(0, 10);

  if (!userProfile) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>Loading profile...</h3>
          <p>Your profile data is being loaded. If this takes too long, make sure you're logged in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Profile Header */}
      <div className="profile-header">
        <ProfilePicture 
          username={userProfile.username}
          photoURL={userProfile.photoURL}
          onPhotoUpdate={updateProfilePhoto}
          isOwner={true}
          size="large"
        />
        
        <div className="profile-info">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>@{userProfile.username}</h1>
            <button 
              className="btn btn-sm btn-ghost" 
              onClick={() => setIsEditingUsername(true)}
            >
              ✏️ Edit
            </button>
          </div>
          
          {isEditingUsername && (
            <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="New username"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text)",
                  padding: "6px 12px",
                  fontSize: "14px",
                  width: "200px"
                }}
              />
              <button className="btn btn-sm btn-primary" onClick={handleSaveUsername} disabled={loading}>
                Save
              </button>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => {
                  setIsEditingUsername(false);
                  setNewUsername(userProfile.username || "");
                  setUsernameError("");
                }}
              >
                Cancel
              </button>
              {usernameError && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{usernameError}</span>}
            </div>
          )}

          <p className="profile-email">{userProfile.email}</p>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", width: "100%" }}>
            <div className="profile-stats">
              <button 
                className="stat-btn"
                onClick={() => setShowFollowers(!showFollowers)}
              >
                <span className="stat-number">{userProfile.followers?.length || 0}</span>
                <span className="stat-label">Followers</span>
              </button>
              <button 
                className="stat-btn"
                onClick={() => setShowFollowing(!showFollowing)}
              >
                <span className="stat-number">{userProfile.following?.length || 0}</span>
                <span className="stat-label">Following</span>
              </button>
              <div className="stat">
                <span className="stat-number">{displayedFavorites.length || 0}</span>
                <span className="stat-label">Favorites</span>
              </div>
            </div>

            {/* Current Favorite Song */}
            <div className="current-favorite-section">
              {currentFavorite ? (
                <div className="current-favorite-display">
                  <span className="current-favorite-label">⭐ Current Favorite:</span>
                  <span className="current-favorite-song">{currentFavorite.title}</span>
                  <span className="current-favorite-anime">({currentFavorite.anime})</span>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={handleRemoveCurrentFavorite}
                    title="Remove current favorite"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowFavoritePicker(!showFavoritePicker)}
                >
                  ⭐ Set Current Favorite
                </button>
              )}

              {showFavoritePicker && favorites.length > 0 && (
                <div className="favorite-picker-dropdown">
                  {favorites.map((song) => (
                    <div 
                      key={song.songId} 
                      className="favorite-picker-item"
                      onClick={() => handleSetCurrentFavorite(song)}
                    >
                      {song.title} - {song.anime}
                    </div>
                  ))}
                  <div 
                    className="favorite-picker-item cancel"
                    onClick={() => setShowFavoritePicker(false)}
                  >
                    Cancel
                  </div>
                </div>
              )}
            </div>

            {/* My List Button */}
            <Link to="/my-list" className="btn btn-primary">
              My List
            </Link>
          </div>
        </div>
      </div>

      {showFollowers && (
        <div className="popup-overlay" onClick={() => setShowFollowers(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Followers</h3>
            <button className="popup-close" onClick={() => setShowFollowers(false)}>×</button>
            <div className="user-list">
              {followersList.length > 0 ? (
                followersList.map(f => (
                  <Link key={f.uid} to={`/user/${f.username}`} className="user-list-item" onClick={() => setShowFollowers(false)}>
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

      {showFollowing && (
        <div className="popup-overlay" onClick={() => setShowFollowing(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Following</h3>
            <button className="popup-close" onClick={() => setShowFollowing(false)}>×</button>
            <div className="user-list">
              {followingList.length > 0 ? (
                followingList.map(f => (
                  <Link key={f.uid} to={`/user/${f.username}`} className="user-list-item" onClick={() => setShowFollowing(false)}>
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

      {/* Bio Section */}
      <div className="profile-bio">
        {isEditing ? (
          <div className="bio-edit">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              rows={3}
            />
            <div className="bio-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleSaveBio}
                disabled={loading}
              >
                {loading ? "Saving…" : "Save Bio"}
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setIsEditing(false);
                  setBio(userProfile.bio || "");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bio-display">
            <p>{userProfile.bio || "No bio yet. Click edit to add one!"}</p>
            <button 
              className="btn btn-sm btn-ghost" 
              onClick={() => setIsEditing(true)}
            >
              Edit Bio
            </button>
          </div>
        )}
      </div>

      {/* Favorite Songs Section */}
      <div className="profile-favorites">
        <h2 className="section-title">⭐ Top 10 Favorite OP/EDs</h2>
        <p className="text-muted" style={{ fontSize: "13px", marginBottom: "12px" }}>
          Drag the ⋮⋮ handle to reorder your favorites
        </p>
        
        {displayedFavorites.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayedFavorites.map(s => s.songId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="card-list">
                {displayedFavorites.map((song, index) => {
                  const rating = song.rating || 0;
                  const ratingInfo = rating > 0 ? RATING_LABELS[rating] : null;
                  const displayIndex = index + 1;
                  
                  return (
                    <SortableSongItem
                      key={song.songId}
                      song={song}
                      displayIndex={displayIndex}
                      ratingInfo={ratingInfo}
                      onRemove={handleRemoveFavorite}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="state-block">
            <p className="text-muted">No favorite OP/EDs yet. Go to My List and add songs to your favorites!</p>
          </div>
        )}
      </div>
    </div>
  );
}
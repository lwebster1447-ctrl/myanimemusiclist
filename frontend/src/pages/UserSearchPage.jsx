// frontend/src/pages/UserSearchPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserSearchPage() {
  const { searchUsers, userProfile, toggleFollow } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const users = await searchUsers(searchTerm.trim());
      console.log('🔍 Search results:', users);
      // Filter out the current user
      setResults(users.filter(u => u.uid !== userProfile?.uid));
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const isFollowing = (targetUid) => {
    return userProfile?.following?.includes(targetUid) || false;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Find Friends</h1>
        <p>Search for other users by their username</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search for a username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          minLength={2}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {searched && results.length === 0 && !loading && (
        <div className="state-block">
          <h3>No users found</h3>
          <p>Try a different search term.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="card-list">
          {results.map((user) => (
            <div key={user.uid} className="song-card">
              <div className="song-card-main">
                <Link to={`/user/${user.username}`} className="song-card-title" style={{ textDecoration: "none" }}>
                  @{user.username}
                </Link>
                <div className="song-card-sub">
                  {user.bio || "No bio yet"}
                </div>
              </div>
              <div className="song-card-actions">
                <button
                  className={`btn btn-sm ${isFollowing(user.uid) ? "btn-ghost" : "btn-primary"}`}
                  onClick={() => {
                    toggleFollow(user.uid);
                    // Update UI by refreshing results
                    handleSearch({ preventDefault: () => {} });
                  }}
                >
                  {isFollowing(user.uid) ? "Unfollow" : "Follow"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
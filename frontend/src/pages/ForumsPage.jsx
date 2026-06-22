// frontend/src/pages/ForumsPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { subscribeToAllForumPosts, searchForumPosts } from "../services/forum.js";

export default function ForumsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Real-time listener for all forum posts
    const unsubscribe = subscribeToAllForumPosts((updatedPosts) => {
      setPosts(updatedPosts);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setLoading(true);
    try {
      const results = await searchForumPosts(searchTerm);
      setPosts(results);
    } catch (error) {
      console.error("Error searching posts:", error);
    }
    setLoading(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    // The real-time listener will update with all posts again
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1>Forums</h1>
            <p>Discuss your favorite anime openings and endings with the community.</p>
          </div>
          {user && (
            <Link to="/forums/create" className="btn btn-primary">
              + Create Forum
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by song title or anime name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
        {searchTerm && (
          <button type="button" className="btn btn-ghost" onClick={handleClearSearch}>
            Clear
          </button>
        )}
      </form>

      {!user && (
        <div className="banner warn">
          You're browsing without an account — sign in to create a forum post or comment.
        </div>
      )}

      {loading ? (
        <div className="state-block">
          <h3>Loading forums...</h3>
        </div>
      ) : posts.length === 0 ? (
        <div className="state-block">
          <h3>{isSearching ? "No results found" : "No forums yet"}</h3>
          <p>
            {isSearching
              ? "Try a different search term."
              : "Be the first to create a forum post about your favorite anime song!"}
          </p>
        </div>
      ) : (
        <div className="card-list">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/forums/${post.id}`}
              className="song-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="song-card-main" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div className="song-card-title" style={{ fontWeight: 600 }}>
                    {post.songTitle}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {post.animeName}
                  </div>
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {post.content?.length > 150 ? post.content.slice(0, 150) + "..." : post.content}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
                  <span>By: {post.username || "Unknown"}</span>
                  <span>•</span>
                  <span>{formatDate(post.createdAt)}</span>
                  <span>•</span>
                  <span>💬 {post.commentCount || 0} comments</span>
                  <span>•</span>
                  <span>❤️ {post.likes?.length || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
// frontend/src/pages/CreateForumPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { createForumPost } from "../services/forum.js";

export default function CreateForumPage() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [songTitle, setSongTitle] = useState("");
  const [animeName, setAnimeName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login");
      return;
    }

    if (!songTitle.trim() || !animeName.trim() || !content.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (content.length > 1000) {
      setError("Content must be 1000 characters or less.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createForumPost(
        user.uid,
        userProfile?.username || "Unknown",
        userProfile?.photoURL || null,
        songTitle,
        animeName,
        content
      );
      navigate("/forums");
    } catch (err) {
      setError(err.message || "Failed to create forum post.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>Please sign in</h3>
          <p>You need to be logged in to create a forum post.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: "12px" }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Create Forum Post</h1>
        <p>Share your thoughts about an anime opening or ending.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: "700px" }}>
        {error && <div className="banner error">{error}</div>}

        <div className="auth-field">
          <label>Song Title *</label>
          <input
            type="text"
            placeholder="e.g., Stay Alive"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label>Anime Name *</label>
          <input
            type="text"
            placeholder="e.g., Re:Zero"
            value={animeName}
            onChange={(e) => setAnimeName(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label>Your Thoughts (max 1000 characters) *</label>
          <textarea
            rows="6"
            placeholder="Write your thoughts about this song..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            required
            style={{
              width: "100%",
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text)",
              padding: "12px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
            {content.length}/1000
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Post"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/forums")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
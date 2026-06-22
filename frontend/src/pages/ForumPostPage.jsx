// frontend/src/pages/ForumPostPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getForumPost,
  deleteForumPost,
  updateForumPost,
  likeForumPost,
  unlikeForumPost,
  getComments,
  addComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../services/forum.js";

export default function ForumPostPage() {
  const { postId } = useParams();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const postData = await getForumPost(postId);
      if (!postData) {
        setError("Post not found");
        setLoading(false);
        return;
      }
      setPost(postData);
      setEditContent(postData.content || "");

      const commentsData = await getComments(postId);
      setComments(commentsData);
    } catch (err) {
      console.error("Error loading post:", err);
      setError("Failed to load post");
    }
    setLoading(false);
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

  const handleLike = async () => {
    if (!user) return;
    try {
      const isLiked = post.likes?.includes(user.uid);
      if (isLiked) {
        await unlikeForumPost(postId, user.uid);
        setPost(prev => ({
          ...prev,
          likes: (prev.likes || []).filter(id => id !== user.uid),
        }));
      } else {
        await likeForumPost(postId, user.uid);
        setPost(prev => ({
          ...prev,
          likes: [...(prev.likes || []), user.uid],
        }));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteForumPost(postId);
      navigate("/forums");
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post");
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    if (editContent.length > 1000) {
      setError("Content must be 1000 characters or less.");
      return;
    }
    try {
      await updateForumPost(postId, editContent);
      setPost(prev => ({ ...prev, content: editContent.trim() }));
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating post:", err);
      setError("Failed to update post");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!newComment.trim()) return;
    if (newComment.length > 1000) {
      setCommentError("Comment must be 1000 characters or less.");
      return;
    }

    try {
      const comment = await addComment(
        postId,
        user.uid,
        userProfile?.username || "Unknown",
        userProfile?.photoURL || null,
        newComment
      );
      setComments(prev => [...prev, comment]);
      setNewComment("");
      // Update comment count on post
      setPost(prev => ({
        ...prev,
        commentCount: (prev.commentCount || 0) + 1,
      }));
      setCommentError("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setCommentError("Failed to add comment");
    }
  };

  const handleCommentLike = async (commentId, isLiked) => {
    if (!user) return;
    try {
      if (isLiked) {
        await unlikeComment(postId, commentId, user.uid);
      } else {
        await likeComment(postId, commentId, user.uid);
      }
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                likes: isLiked
                  ? (c.likes || []).filter(id => id !== user.uid)
                  : [...(c.likes || []), user.uid],
              }
            : c
        )
      );
    } catch (err) {
      console.error("Error toggling comment like:", err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPost(prev => ({
        ...prev,
        commentCount: Math.max(0, (prev.commentCount || 0) - 1),
      }));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>Loading post...</h3>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>Post not found</h3>
          <p>The forum post you're looking for doesn't exist.</p>
          <Link to="/forums" className="btn btn-primary" style={{ marginTop: "12px" }}>
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === post.uid;
  const isLiked = post.likes?.includes(user?.uid) || false;

  return (
    <div className="page">
      <div style={{ marginBottom: "16px" }}>
        <Link to="/forums" className="btn btn-sm btn-ghost">
          ← Back to Forums
        </Link>
      </div>

      <div className="song-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {post.photoURL ? (
              <img
                src={post.photoURL}
                alt={post.username}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--accent-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  color: "var(--accent)",
                  fontSize: "18px",
                }}
              >
                {post.username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600 }}>{post.username || "Unknown"}</div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {formatDate(post.createdAt)}
              </div>
            </div>
            {isOwner && (
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={handleDelete}
                  style={{ color: "var(--danger)" }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span className="seq-badge op">{post.songTitle}</span>
            <span className="seq-badge album">{post.animeName}</span>
          </div>
        </div>

        {isEditing ? (
          <div>
            <textarea
              rows="6"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={1000}
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
              {editContent.length}/1000
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button className="btn btn-primary btn-sm" onClick={handleUpdate}>
                Save Changes
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "15px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
            {post.content}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            paddingTop: "12px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleLike}
            disabled={!user}
          >
            ❤️ {post.likes?.length || 0} {post.likes?.length === 1 ? "like" : "likes"}
          </button>
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            💬 {post.commentCount || 0} comments
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div style={{ marginTop: "24px" }}>
        <h3 style={{ marginBottom: "16px" }}>
          Comments ({comments.length})
        </h3>

        {user ? (
          <form onSubmit={handleCommentSubmit} style={{ marginBottom: "20px" }}>
            <textarea
              rows="3"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={1000}
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
              {newComment.length}/1000
            </div>
            {commentError && <div className="banner error" style={{ marginTop: "8px" }}>{commentError}</div>}
            <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "8px" }}>
              Post Comment
            </button>
          </form>
        ) : (
          <div className="banner warn">
            <Link to="/login">Sign in</Link> to leave a comment.
          </div>
        )}

        {comments.length === 0 ? (
          <div className="state-block" style={{ padding: "30px 20px" }}>
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="card-list">
            {comments.map((comment) => {
              const isCommentOwner = user?.uid === comment.uid;
              const isCommentLiked = comment.likes?.includes(user?.uid) || false;
              return (
                <div
                  key={comment.id}
                  className="song-card"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {comment.photoURL ? (
                      <img
                        src={comment.photoURL}
                        alt={comment.username}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "var(--accent-soft)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          color: "var(--accent)",
                          fontSize: "14px",
                        }}
                      >
                        {comment.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>
                        {comment.username || "Unknown"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                    {isCommentOwner && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleCommentDelete(comment.id)}
                        style={{ marginLeft: "auto", color: "var(--danger)" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {comment.content}
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleCommentLike(comment.id, isCommentLiked)}
                    disabled={!user}
                    style={{ alignSelf: "flex-start" }}
                  >
                    ❤️ {comment.likes?.length || 0}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
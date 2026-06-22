// frontend/src/pages/SetupUsernamePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function SetupUsernamePage() {
  const { pendingGoogleUser, completeGoogleSignUp } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (!pendingGoogleUser) {
    navigate("/");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    
    setBusy(true);
    setError("");
    try {
      await completeGoogleSignUp(username);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="auth-card">
        <h1>Choose a username</h1>
        <p className="sub">
          Welcome! Please choose a unique username for your account.
        </p>

        {error && <div className="banner error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              required
              minLength={3}
              autoFocus
            />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              This will be your public display name.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Creating profile…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
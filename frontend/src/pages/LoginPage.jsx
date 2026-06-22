// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    checkUsernameTaken,
    sendVerificationEmail,
    reloadUser,
    emailVerified,
    showVerificationMessage,
    verificationEmail,
    signOut,
    resetPassword
  } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setVerificationEmailSent("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const usernameTaken = await checkUsernameTaken(username);
        if (usernameTaken) {
          throw new Error("Username already taken. Please choose another.");
        }
        await signUpWithEmail(email, password, username);
        setVerificationEmailSent(email);
        setError("");
      } else {
        await signInWithEmail(email, password);
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const handleBackToLogin = async () => {
    await signOut();
    setVerificationEmailSent("");
    setError("");
    setMode("signin");
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  // If showing verification message
  if (showVerificationMessage || verificationEmailSent) {
    const emailToShow = verificationEmail || verificationEmailSent;
    return (
      <div className="page">
        <div className="auth-card">
          <h1>Verify Your Email</h1>
          <p className="sub">
            A verification email has been sent to <strong>{emailToShow}</strong>.
          </p>
          
          <div className="banner warn" style={{ marginTop: "16px" }}>
            <p>✅ Please check your inbox and click the verification link to activate your account.</p>
            <p style={{ marginTop: "8px", fontSize: "13px" }}>
              After verifying, please sign in again.
            </p>
            <div style={{ 
              marginTop: "12px", 
              padding: "10px 14px", 
              backgroundColor: "rgba(255, 200, 0, 0.1)", 
              borderRadius: "6px",
              border: "1px solid rgba(255, 200, 0, 0.3)"
            }}>
              <p style={{ fontSize: "13px", margin: 0 }}>
  📧 <strong>Tip:</strong> If you don't see the email in your inbox, please check your <strong>spam / junk folder</strong> and mark the email as <strong>"Not spam"</strong> to ensure you receive future emails.
</p>
            </div>
          </div>
          
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button 
              className="btn btn-primary" 
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </div>
          
          {error && <div className="banner error" style={{ marginTop: "12px" }}>{error}</div>}
        </div>
      </div>
    );
  }

  // If showing forgot password
  if (showForgotPassword) {
    return (
      <div className="page">
        <div className="auth-card">
          <h1>Reset Password</h1>
          <p className="sub">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {resetEmailSent ? (
            <>
              <div className="banner warn">
                <p>✅ A password reset link has been sent to <strong>{email}</strong>.</p>
                <p style={{ marginTop: "8px", fontSize: "13px" }}>
                  Please check your inbox and click the link to reset your password.
                </p>
                <div style={{ 
                  marginTop: "12px", 
                  padding: "10px 14px", 
                  backgroundColor: "rgba(255, 200, 0, 0.1)", 
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 200, 0, 0.3)"
                }}>
                  <p style={{ fontSize: "13px", margin: 0 }}>
                    📧 <strong>Tip:</strong> If you don't see the email in your inbox, please check your <strong>spam / junk folder</strong> 
                    and mark the email as <strong>"Not spam"</strong> to ensure you receive future emails.
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                  setEmail("");
                  setError("");
                }}
                style={{ width: "100%", marginTop: "16px" }}
              >
                Back to Login
              </button>
            </>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoFocus
                />
              </div>

              {error && <div className="banner error">{error}</div>}

              <button 
                className="btn btn-primary" 
                type="submit" 
                disabled={busy} 
                style={{ width: "100%" }}
              >
                {busy ? "Sending..." : "Send Reset Link"}
              </button>

              <div style={{ marginTop: "12px", textAlign: "center" }}>
                <button 
                  type="button" 
                  className="btn btn-sm btn-ghost" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError("");
                    setResetEmailSent(false);
                  }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="auth-card">
        <h1>{mode === "signup" ? "Create an account" : "Welcome back"}</h1>
        <p className="sub">
          {mode === "signup"
            ? "Save songs and rate them across devices."
            : "Sign in to see your saved list."}
        </p>

        {error && <div className="banner error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
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
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Min 6 characters" : "Enter your password"}
              required
              minLength={6}
            />
          </div>

          {mode === "signin" && (
            <div style={{ textAlign: "right", marginBottom: "12px" }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError("");
                  setResetEmailSent(false);
                }}
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="divider">or</div>

        <button className="btn" onClick={handleGoogle} disabled={busy} style={{ width: "100%" }}>
          Continue with Google
        </button>

        <div className="auth-toggle">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

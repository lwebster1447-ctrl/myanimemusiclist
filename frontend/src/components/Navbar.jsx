// frontend/src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    console.log("🔴 Sign out button clicked");
    try {
      await signOut();
      console.log("✅ Sign out successful");
      navigate("/");
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <img 
          src="/logo.png" 
          alt="MyAnimeMusicList" 
          className="navbar-logo"
        />
        <span>MyAnimeMusicList</span>
      </Link>

      <nav className="navbar-links">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>
          Search
        </Link>
        <Link to="/forums" className={location.pathname === "/forums" || location.pathname.startsWith("/forums/") ? "active" : ""}>
          Forums
        </Link>
        {user && (
          <>
            <Link to="/users" className={location.pathname === "/users" ? "active" : ""}>
              Find Friends
            </Link>
            <Link to="/profile" className={location.pathname === "/profile" ? "active" : ""}>
              My Profile
            </Link>
          </>
        )}
      </nav>

      <div className="navbar-user">
        {user ? (
          <>
            <span>{userProfile?.username || user.displayName || user.email}</span>
            <button 
              className="btn btn-sm btn-ghost" 
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-sm">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
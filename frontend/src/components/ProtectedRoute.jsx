// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, emailVerified } = useAuth();

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is verified (skip for Google sign-in)
  if (!emailVerified && user.providerData[0]?.providerId !== "google.com") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// frontend/src/App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import MyListPage from "./pages/MyListPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SetupUsernamePage from "./pages/SetupUsernamePage.jsx";
import UserSearchPage from "./pages/UserSearchPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import UserMyListPage from "./pages/UserMyListPage.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import AdSenseLoader from "./components/AdSenseLoader.jsx";
import ForumsPage from "./pages/ForumsPage.jsx";
import CreateForumPage from "./pages/CreateForumPage.jsx";
import ForumPostPage from "./pages/ForumPostPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <AdSenseLoader />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/setup-username" element={<SetupUsernamePage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-list"
                element={
                  <ProtectedRoute>
                    <MyListPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/users" element={<UserSearchPage />} />
              <Route path="/user/:username" element={<UserProfilePage />} />
              <Route path="/user/:username/my-list" element={<UserMyListPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/forums" element={<ForumsPage />} />
              <Route
                path="/forums/create"
                element={
                  <ProtectedRoute>
                    <CreateForumPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/forums/:postId" element={<ForumPostPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

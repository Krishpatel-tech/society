import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom'; // Import Navigate
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode as a named import
import './App.css';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MaintenancePage from './pages/MaintenancePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage'; // Import new ProfilePage

// ProtectedRoute component for admin access
const ProtectedRoute = ({ children, isAuthenticated, isAdmin }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// UserRoute component for authenticated user access
const UserRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const shouldUseDark = savedTheme === 'dark';
    setIsDarkMode(shouldUseDark);
    document.body.classList.toggle('dark-theme', shouldUseDark);
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      try {
        const decodedToken = jwtDecode(token);
        setIsAdmin(decodedToken.user.isAdmin);
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsAdmin(false);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      }
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    window.location.href = '/login';
  };

  const handleThemeToggle = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', nextMode);
  };

  const themeToggleLabel = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/" className="nav-brand">KAMAXI TRIPLEX</Link>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleThemeToggle}
                  className="nav-item theme-toggle-button"
                  type="button"
                  aria-label={themeToggleLabel}
                  title={themeToggleLabel}
                >
                  <svg className={`theme-icon-svg ${isDarkMode ? 'is-moon' : 'is-sun'}`} viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="theme-core" cx="12" cy="12" r="5" />
                    <g className="theme-rays">
                      <line x1="12" y1="1.5" x2="12" y2="4" />
                      <line x1="12" y1="20" x2="12" y2="22.5" />
                      <line x1="1.5" y1="12" x2="4" y2="12" />
                      <line x1="20" y1="12" x2="22.5" y2="12" />
                      <line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
                      <line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
                      <line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
                      <line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
                    </g>
                    <circle className="theme-moon-cut" cx="15" cy="9" r="5" />
                  </svg>
                </button>
                <Link to="/maintenance" className="nav-item">Maintenance</Link>
                <Link to="/announcements" className="nav-item">Announcements</Link>
                <Link to="/profile" className="nav-item">Profile</Link> {/* New Profile Link */}
                {isAdmin && <Link to="/admin" className="nav-item">Admin</Link>}
                <button onClick={handleLogout} className="nav-item nav-button">Logout</button>
              </>
            ) : (
              <>
                <button
                  onClick={handleThemeToggle}
                  className="nav-item theme-toggle-button"
                  type="button"
                  aria-label={themeToggleLabel}
                  title={themeToggleLabel}
                >
                  <svg className={`theme-icon-svg ${isDarkMode ? 'is-moon' : 'is-sun'}`} viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="theme-core" cx="12" cy="12" r="5" />
                    <g className="theme-rays">
                      <line x1="12" y1="1.5" x2="12" y2="4" />
                      <line x1="12" y1="20" x2="12" y2="22.5" />
                      <line x1="1.5" y1="12" x2="4" y2="12" />
                      <line x1="20" y1="12" x2="22.5" y2="12" />
                      <line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
                      <line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
                      <line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
                      <line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
                    </g>
                    <circle className="theme-moon-cut" cx="15" cy="9" r="5" />
                  </svg>
                </button>
                <Link to="/login" className="nav-item">Login</Link>
              </>
            )}
          </div>
        </nav>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route
            path="/maintenance"
            element={
              <UserRoute isAuthenticated={isAuthenticated}>
                <MaintenancePage />
              </UserRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <UserRoute isAuthenticated={isAuthenticated}>
                <AnnouncementsPage />
              </UserRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <UserRoute isAuthenticated={isAuthenticated}>
                <ProfilePage />
              </UserRoute>
            }
          /> {/* New Profile Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, NavLink, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './App.css';
import { UXContext } from './context/UXContext';
import { trackEvent } from './utils/telemetry';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MaintenancePage from './pages/MaintenancePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage'; // Import new ProfilePage

const ProtectedRoute = ({ children, isAuthenticated, isAdmin, isAuthReady }) => {
  if (!isAuthReady) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const UserRoute = ({ children, isAuthenticated, isAuthReady }) => {
  if (!isAuthReady) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppShell = ({
  isAdmin,
  isAuthenticated,
  isAuthReady,
  isDarkMode,
  handleThemeToggle,
  handleLogout,
  toasts,
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const themeToggleLabel = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <div className="App">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="nav-brand">
          <img src="/logo192.png" alt="Society Logo" className="nav-logo" />
          <span>KAMAXI TRIPLEX</span>
        </Link>
        <button
          onClick={handleThemeToggle}
          className="nav-item theme-toggle-button mobile-theme-toggle"
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
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={isMobileMenuOpen}
          aria-controls="site-nav-links"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          Menu
        </button>
        <div id="site-nav-links" className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <button
            onClick={handleThemeToggle}
            className="nav-item theme-toggle-button desktop-theme-toggle"
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
          {isAuthenticated ? (
            <>
              <NavLink to="/maintenance" className="nav-item">Maintenance</NavLink>
              <NavLink to="/announcements" className="nav-item">Announcements</NavLink>
              <NavLink to="/profile" className="nav-item">Profile</NavLink>
              {isAdmin && <NavLink to="/admin" className="nav-item">Admin</NavLink>}
              <button onClick={handleLogout} className="nav-item nav-button">Logout</button>
            </>
          ) : (
            <NavLink to="/login" className="nav-item">Login</NavLink>
          )}
        </div>
      </nav>

      {!isAuthReady ? (
        <div className="page-loader">
          <span className="page-loader-spinner" />
          <p>Preparing your session...</p>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route
            path="/maintenance"
            element={
              <UserRoute isAuthenticated={isAuthenticated} isAuthReady={isAuthReady}>
                <MaintenancePage />
              </UserRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <UserRoute isAuthenticated={isAuthenticated} isAuthReady={isAuthReady}>
                <AnnouncementsPage />
              </UserRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <UserRoute isAuthenticated={isAuthenticated} isAuthReady={isAuthReady}>
                <ProfilePage />
              </UserRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin} isAuthReady={isAuthReady}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      )}

      {isAuthenticated && (
        <div className={`mobile-bottom-nav ${isAdmin ? 'has-admin' : 'no-admin'}`} aria-label="Mobile quick navigation">
          <NavLink to="/maintenance" className="mobile-bottom-link">Maintenance</NavLink>
          <NavLink to="/announcements" className="mobile-bottom-link">Updates</NavLink>
          <NavLink to="/profile" className="mobile-bottom-link">Profile</NavLink>
          {isAdmin && <NavLink to="/admin" className="mobile-bottom-link">Admin</NavLink>}
        </div>
      )}

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const shouldUseDark = savedTheme === 'dark';
    setIsDarkMode(shouldUseDark);
    document.body.classList.toggle('dark-theme', shouldUseDark);
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const tokenExpiry = decodedToken?.exp ? decodedToken.exp * 1000 : 0;
        const isExpired = !tokenExpiry || tokenExpiry <= Date.now();
        if (isExpired) {
          localStorage.removeItem('token');
          setIsAdmin(false);
          setIsAuthenticated(false);
          setIsAuthReady(true);
          return;
        }
        setIsAuthenticated(true);
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
    setIsAuthReady(true);
  }, []);

  React.useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setIsAdmin(false);
          trackEvent('auth_session_expired');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?session=expired';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, []);

  const handleLogout = () => {
    trackEvent('auth_logout');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    window.location.href = '/login';
  };

  const handleThemeToggle = () => {
    const nextMode = !isDarkMode;
    trackEvent('theme_toggled', { mode: nextMode ? 'dark' : 'light' });
    setIsDarkMode(nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', nextMode);
  };

  const notify = React.useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3400);
  }, []);

  const track = React.useCallback((eventName, metadata = {}) => {
    trackEvent(eventName, metadata);
  }, []);

  return (
    <Router>
      <UXContext.Provider value={{ notify, track }}>
        <AppShell
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          isAuthReady={isAuthReady}
          isDarkMode={isDarkMode}
          handleThemeToggle={handleThemeToggle}
          handleLogout={handleLogout}
          toasts={toasts}
        />
      </UXContext.Provider>
    </Router>
  );
}

export default App;

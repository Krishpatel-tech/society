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

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/" className="nav-brand">KAMAXI TRIPLEX</Link>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <Link to="/maintenance" className="nav-item">Maintenance</Link>
                <Link to="/announcements" className="nav-item">Announcements</Link>
                <Link to="/profile" className="nav-item">Profile</Link> {/* New Profile Link */}
                {isAdmin && <Link to="/admin" className="nav-item">Admin</Link>}
                <button onClick={handleLogout} className="nav-item nav-button">Logout</button>
              </>
            ) : (
              <Link to="/login" className="nav-item">Login</Link>
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

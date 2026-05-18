import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function BusinessRoute({ children }) {
  const { isBusinessLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="status">Checking session…</p>;
  }

  if (!isBusinessLoggedIn) {
    return <Navigate to="/business/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function GuestBusinessRoute({ children }) {
  const { isBusinessLoggedIn, loading } = useAuth();

  if (loading) {
    return <p className="status">Loading…</p>;
  }

  if (isBusinessLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/** Store and customer auth — not available while logged in as a business */
export function CustomerAreaRoute({ children }) {
  const { isBusinessLoggedIn, loading } = useAuth();

  if (loading) {
    return <p className="status">Loading…</p>;
  }

  if (isBusinessLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function UserRoute({ children }) {
  const { isUserLoggedIn, isBusinessLoggedIn, loading } = useAuth();

  if (loading) {
    return <p className="status">Loading…</p>;
  }

  if (isBusinessLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isUserLoggedIn) {
    return <Navigate to="/account" replace />;
  }

  return children;
}

export function GuestUserRoute({ children }) {
  const { isUserLoggedIn, isBusinessLoggedIn, loading } = useAuth();

  if (loading) {
    return <p className="status">Loading…</p>;
  }

  if (isBusinessLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isUserLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

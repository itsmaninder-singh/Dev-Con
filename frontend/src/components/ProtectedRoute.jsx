import { Navigate, useLocation } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth.js";

export default function ProtectedRoute({ children }) {
  const { ready, loading } = useRequireAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!ready) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(currentPath)}`} replace />;
  }

  return children;
}

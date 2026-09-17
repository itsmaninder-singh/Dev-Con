import { Navigate, useLocation } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth.js";

export default function ProtectedRoute({ children, allowIncomplete = false }) {
  const { ready, loading, user } = useRequireAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!ready) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(currentPath)}`} replace />;
  }

  // If profile is incomplete and route requires a completed profile -> redirect to onboarding
  if (!user?.isProfileComplete && !allowIncomplete) {
    return <Navigate to="/onboarding" replace />;
  }

  // If profile is already complete and trying to access /onboarding -> redirect to explore
  if (user?.isProfileComplete && allowIncomplete && location.pathname === "/onboarding") {
    return <Navigate to="/explore" replace />;
  }

  return children;
}

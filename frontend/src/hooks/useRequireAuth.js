import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function useRequireAuth() {
  const { user, initializing, loading = initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname + location.search;

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?next=${encodeURIComponent(currentPath)}`, { replace: true });
    }
  }, [loading, user, navigate, currentPath]);

  return {
    ready: !loading && !!user,
    user,
    loading,
  };
}

export default useRequireAuth;

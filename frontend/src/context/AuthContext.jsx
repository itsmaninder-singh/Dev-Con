import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, setAccessToken } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    if (session?.accessToken && session?.user) {
      localStorage.setItem("devconnect_auth_session", JSON.stringify(session));
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      try {
        const saved = localStorage.getItem("devconnect_auth_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.user = updated;
          localStorage.setItem("devconnect_auth_session", JSON.stringify(parsed));
        }
      } catch {}
      return updated;
    });
  }, []);

  useEffect(() => {
    let active = true;

    // Check for saved session in localStorage to prevent reload bootouts
    const saved =
      localStorage.getItem("devconnect_auth_session") ||
      localStorage.getItem("devconnect_demo_session");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.accessToken && parsed?.user) {
          applySession(parsed);
          setInitializing(false);
          // Verify/refresh in background
          authApi
            .refresh()
            .then((fresh) => {
              if (active && fresh?.accessToken) applySession(fresh);
            })
            .catch(() => {});
          return;
        }
      } catch {
        localStorage.removeItem("devconnect_auth_session");
      }
    }

    authApi
      .refresh()
      .then((session) => {
        if (active && session?.accessToken) {
          applySession(session);
        }
      })
      .catch(() => {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setInitializing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applySession]);

  const register = useCallback(
    async (payload) => {
      const session = await authApi.register(payload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const login = useCallback(
    async (payload) => {
      const session = await authApi.login(payload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const loginWithGoogle = useCallback(
    async (tokenPayload) => {
      const session = await authApi.google(tokenPayload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const loginWithGithub = useCallback(
    async (payload) => {
      const session = await authApi.github(payload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem("devconnect_auth_session");
    localStorage.removeItem("devconnect_demo_session");
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        loading: initializing,
        register,
        login,
        loginWithGoogle,
        loginWithGithub,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

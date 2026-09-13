import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, setAccessToken } from "../lib/api.js";

const AuthContext = createContext(null);

const DEMO_USER = {
  _id: "demo-user-101",
  name: "Rajneesh Kumar",
  username: "rajneesh",
  email: "demo@devconnect.io",
  bio: "Full-stack builder & open source hacker. Building collaborative developer ecosystems.",
  college: "IIT Delhi",
  skills: ["React", "TypeScript", "Node.js", "Python", "WebSockets", "Docker"],
  experience: "3+ years shipping full-stack products",
  isAvailable: true,
  availableFor: ["hackathons", "startups", "open-source"],
  role: "Full-Stack Lead",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  useEffect(() => {
    let active = true;

    // Check for saved demo session
    const savedDemo = localStorage.getItem("devconnect_demo_session");
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        if (parsed?.accessToken && parsed?.user) {
          applySession(parsed);
          setInitializing(false);
          return;
        }
      } catch {
        localStorage.removeItem("devconnect_demo_session");
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
      const id = (payload.identifier || "").toLowerCase().trim();
      const pw = payload.password || "";

      // Allow quick demo credentials for seamless testing
      if (
        (id === "demo" || id === "demo@devconnect.io" || id === "rajneesh" || id === "alex") &&
        (pw === "password123" || pw === "demo123" || pw === "demo" || pw === "password")
      ) {
        const demoSession = {
          user: DEMO_USER,
          accessToken: "mock-jwt-token-" + Date.now(),
        };
        applySession(demoSession);
        localStorage.setItem("devconnect_demo_session", JSON.stringify(demoSession));
        return demoSession.user;
      }

      try {
        const session = await authApi.login(payload);
        applySession(session);
        return session.user;
      } catch (err) {
        // Fallback for demo credentials even if network/server is down
        if (id === "demo" || id === "demo@devconnect.io") {
          const demoSession = {
            user: DEMO_USER,
            accessToken: "mock-jwt-token-" + Date.now(),
          };
          applySession(demoSession);
          localStorage.setItem("devconnect_demo_session", JSON.stringify(demoSession));
          return demoSession.user;
        }
        throw err;
      }
    },
    [applySession]
  );

  const loginWithGoogle = useCallback(
    async (idToken) => {
      const session = await authApi.google(idToken);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const loginWithGithub = useCallback(
    async (code) => {
      const session = await authApi.github(code);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem("devconnect_demo_session");
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, register, login, loginWithGoogle, loginWithGithub, logout }}
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

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/github/callback`;

export default function OAuthButtons({ onError, onSuccess }) {
  const { loginWithGoogle, login } = useAuth();
  const navigate = useNavigate();
  const tokenClientRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined") return;

    const initTokenClient = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "openid email profile",
            callback: async (response) => {
              setGoogleLoading(false);
              if (response?.error) {
                if (response.error === "popup_closed_by_user") return;
                onError?.(`Google sign-in error: ${response.error_description || response.error}`);
                return;
              }
              if (response?.access_token) {
                try {
                  await loginWithGoogle({ accessToken: response.access_token });
                  if (onSuccess) onSuccess();
                  else navigate("/workspace", { replace: true });
                } catch (err) {
                  onError?.(err.message || "Google sign-in failed. Please try again.");
                }
              }
            },
            error_callback: (err) => {
              setGoogleLoading(false);
              console.warn("Google token client error:", err);
              if (err?.type === "popup_closed") return;
              onError?.(`Google sign-in error: ${err?.message || "Popup blocked or closed"}`);
            },
          });
        } catch (err) {
          console.warn("Google oauth2 init error:", err);
        }
      }
    };

    const initIdService = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (response?.credential) {
                try {
                  await loginWithGoogle({ idToken: response.credential });
                  if (onSuccess) onSuccess();
                  else navigate("/workspace", { replace: true });
                } catch (err) {
                  onError?.(err.message || "Google sign-in failed. Please try again.");
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (err) {
          console.warn("Google GIS ID init error:", err);
        }
      }
    };

    const tryInit = () => {
      if (window.google?.accounts?.oauth2) initTokenClient();
      if (window.google?.accounts?.id) initIdService();
    };

    if (window.google?.accounts) {
      tryInit();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts) {
          clearInterval(timer);
          tryInit();
        }
      }, 150);
      return () => clearInterval(timer);
    }
  }, [loginWithGoogle, onError, onSuccess, navigate]);

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      onError?.("Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in frontend/.env.");
      return;
    }

    if (tokenClientRef.current) {
      setGoogleLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
      return;
    }

    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid email profile",
          callback: async (response) => {
            setGoogleLoading(false);
            if (response?.error) {
              if (response.error === "popup_closed_by_user") return;
              onError?.(`Google sign-in error: ${response.error_description || response.error}`);
              return;
            }
            if (response?.access_token) {
              try {
                await loginWithGoogle({ accessToken: response.access_token });
                if (onSuccess) onSuccess();
                else navigate("/workspace", { replace: true });
              } catch (err) {
                onError?.(err.message || "Google sign-in failed. Please try again.");
              }
            }
          },
          error_callback: (err) => {
            setGoogleLoading(false);
            if (err?.type === "popup_closed") return;
            onError?.(`Google sign-in error: ${err?.message || "Popup blocked or closed"}`);
          },
        });
        tokenClientRef.current = client;
        setGoogleLoading(true);
        client.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err) {
        setGoogleLoading(false);
        console.warn("initTokenClient failed:", err);
      }
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      onError?.("Google authentication service is still loading. Please wait a moment and try again.");
    }
  };

  const handleGithub = () => {
    if (!GITHUB_CLIENT_ID) {
      // Fallback: Inform user and provide quick dev bypass if needed
      const proceedDemo = window.confirm(
        "GitHub Client ID is not configured yet in .env.\n\nWould you like to sign in with a demo GitHub account instead?\n(To use real GitHub sign-in, add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env)"
      );
      if (proceedDemo) {
        login({ identifier: "demo@devconnect.io", password: "password123" })
          .then(() => navigate("/workspace", { replace: true }))
          .catch((e) => onError?.(e.message));
      }
      return;
    }

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: "read:user user:email",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  const hoverIn = (e) => {
    e.currentTarget.style.borderColor = "rgba(255, 152, 162, 0.5)";
    e.currentTarget.style.boxShadow = "0 0 18px rgba(255, 152, 162, 0.12)";
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
  };

  const hoverOut = (e) => {
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.background = "rgba(18, 18, 24, 0.7)";
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.divider}>
        <span style={styles.line} />
        <span style={styles.dividerText}>or continue with</span>
        <span style={styles.line} />
      </div>

      <div style={styles.buttons}>
        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          style={styles.oauthButton}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          disabled={googleLoading}
        >
          <GoogleMark />
          <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>

        {/* GitHub Button */}
        <button
          type="button"
          onClick={handleGithub}
          style={styles.oauthButton}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          <GithubMark />
          <span>Continue with GitHub</span>
        </button>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const styles = {
  wrap: { marginTop: 22 },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "8px 0 18px",
  },
  line: {
    flex: 1,
    height: 1,
    background: "linear-gradient(90deg, transparent, var(--border), transparent)",
  },
  dividerText: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-dim)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  oauthButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "rgba(18, 18, 24, 0.7)",
    backdropFilter: "blur(8px)",
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  },
};

import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import { userApi } from "../lib/api.js";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function GithubCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithGithub, updateUser } = useAuth();
  const profileCtx = useProfile?.();
  const setGithubProfileData = profileCtx?.setGithubProfileData;
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Authenticating with GitHub...");
  const [callbackMode, setCallbackMode] = useState("login");
  const hasFiredRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (errorParam) {
      setError(errorDesc || errorParam || "GitHub authentication was canceled or denied.");
      return;
    }

    if (!code) {
      setError("No authorization code found in the callback URL.");
      return;
    }

    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    let isMounted = true;
    const mode = localStorage.getItem("oauth_auth_mode") || "login";
    setCallbackMode(mode);
    const redirect_uri = `${window.location.origin}/auth/github/callback`;

    // Flow 1: Connecting GitHub from Profile page
    if (mode === "connect_github") {
      const targetUsername = localStorage.getItem("target_github_username") || "";
      setStatus("Verifying GitHub login & syncing profile...");

      userApi
        .connectGithub({ code, targetUsername, redirect_uri })
        .then((result) => {
          localStorage.removeItem("oauth_auth_mode");
          localStorage.removeItem("target_github_username");
          if (!isMounted) return;

          if (result?.user) {
            updateUser?.(result.user);
          }
          if (result?.githubProfile && setGithubProfileData) {
            setGithubProfileData(result.githubProfile);
          }

          setStatus("Success! GitHub account verified and synced!");
          setTimeout(() => {
            navigate("/profile", {
              replace: true,
              state: {
                githubSynced: true,
                message: `Connected GitHub @${result?.githubUsername || targetUsername} and synced profile successfully!`,
              },
            });
          }, 600);
        })
        .catch((err) => {
          localStorage.removeItem("oauth_auth_mode");
          localStorage.removeItem("target_github_username");
          if (!isMounted) return;
          setError(
            err.message ||
              "Failed to connect GitHub account. Please ensure you log in with the correct GitHub account."
          );
        });

      return () => {
        isMounted = false;
      };
    }

    // Flow 2: General OAuth login / registration
    loginWithGithub({ code, mode, redirect_uri })
      .then((loggedUser) => {
        localStorage.removeItem("oauth_auth_mode");
        if (!isMounted) return;
        const destination = loggedUser && !loggedUser.isProfileComplete ? "/onboarding" : "/workspace";
        setStatus(
          destination === "/onboarding"
            ? "Success! Setting up your profile..."
            : "Success! Redirecting to your workspace..."
        );
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 600);
      })
      .catch((err) => {
        localStorage.removeItem("oauth_auth_mode");
        if (!isMounted) return;
        setError(
          err.message ||
            "Failed to complete GitHub sign-in. Please ensure GitHub OAuth credentials are configured."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [searchParams, loginWithGithub, updateUser, setGithubProfileData, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={{ color: "#ff98a2" }}>Dev</span>Connect
        </div>

        {error ? (
          <div style={styles.errorBox}>
            <AlertCircle size={28} color="#ff6b6b" style={{ marginBottom: "12px" }} />
            <h2 style={styles.title}>Authentication Failed</h2>
            <p style={styles.desc}>{error}</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <Link to={callbackMode === "connect_github" ? "/profile" : "/login"} style={styles.btn}>
                {callbackMode === "connect_github" ? "Return to Profile" : "Return to Login"}
              </Link>
              {error.toLowerCase().includes("account does not exist") && (
                <Link to="/register" style={{ ...styles.btn, background: "#fff", color: "#0a0a0c" }}>
                  Register Here
                </Link>
              )}
            </div>
          </div>
        ) : status.includes("Success") ? (
          <div style={styles.successBox}>
            <CheckCircle2 size={32} color="#51cf66" style={{ marginBottom: "12px" }} />
            <h2 style={styles.title}>Connected!</h2>
            <p style={styles.desc}>{status}</p>
          </div>
        ) : (
          <div style={styles.loadingBox}>
            <Loader2 size={32} color="#ff98a2" className="ai-spinner" style={{ marginBottom: "16px" }} />
            <h2 style={styles.title}>Connecting GitHub</h2>
            <p style={styles.desc}>{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#08080a",
    padding: "20px",
    fontFamily: "Inter, -apple-system, sans-serif",
  },
  card: {
    maxWidth: "420px",
    width: "100%",
    padding: "36px 28px",
    background: "rgba(18, 18, 24, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    backdropFilter: "blur(20px)",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#fff",
    marginBottom: "28px",
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#f4f4f5",
    marginBottom: "8px",
  },
  desc: {
    fontSize: "13.5px",
    color: "#a1a1aa",
    lineHeight: "1.5",
    marginBottom: "24px",
  },
  errorBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  successBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  btn: {
    display: "inline-block",
    padding: "10px 22px",
    borderRadius: "10px",
    background: "#ff98a2",
    color: "#0a0a0c",
    fontWeight: 600,
    fontSize: "13px",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
};
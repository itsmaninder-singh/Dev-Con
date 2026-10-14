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
  const [callbackMode, setCallbackMode] = useState(() => {
    return localStorage.getItem("oauth_auth_mode") || "login";
  });
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

    const mode = localStorage.getItem("oauth_auth_mode") || "login";
    setCallbackMode(mode);
    const redirect_uri =
      import.meta.env.VITE_GITHUB_REDIRECT_URI ||
      `${window.location.origin}/auth/github/callback`;

    // Flow 1: Connecting GitHub from Profile page
    if (mode === "connect_github") {
      const targetUsername = localStorage.getItem("target_github_username") || "";
      setStatus("Connecting GitHub account & syncing repos...");

      userApi
        .connectGithub({ code, targetUsername, redirect_uri })
        .then((result) => {
          localStorage.removeItem("oauth_auth_mode");
          localStorage.removeItem("target_github_username");

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
          }, 450);
        })
        .catch((err) => {
          localStorage.removeItem("oauth_auth_mode");
          localStorage.removeItem("target_github_username");
          setError(
            err.message ||
              "Failed to connect GitHub account. Please ensure you log in with the correct GitHub account."
          );
        });

      return;
    }

    // Flow 2: General OAuth login / registration
    setStatus(
      mode === "register"
        ? "Creating your account with GitHub..."
        : "Signing in with GitHub..."
    );

    const timeoutTimer = setTimeout(() => {
      setError("The server took longer than expected to respond. Please try signing in again.");
    }, 25000);

    loginWithGithub({ code, mode, redirect_uri })
      .then((loggedUser) => {
        clearTimeout(timeoutTimer);
        localStorage.removeItem("oauth_auth_mode");
        const destination =
          loggedUser && !loggedUser.isProfileComplete ? "/onboarding" : "/workspace";
        setStatus(
          destination === "/onboarding"
            ? "Success! Setting up your profile..."
            : "Success! Redirecting to your workspace..."
        );
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 400);
      })
      .catch((err) => {
        clearTimeout(timeoutTimer);
        localStorage.removeItem("oauth_auth_mode");
        console.error("[GithubCallback] Login error:", err);
        setError(
          err.message ||
            "Failed to complete GitHub sign-in. Please ensure GitHub OAuth credentials are configured."
        );
      });

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [searchParams, loginWithGithub, updateUser, setGithubProfileData, navigate]);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spinKf {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 10px rgba(255, 152, 162, 0.3)); }
          50% { transform: scale(1.06); opacity: 1; filter: drop-shadow(0 0 20px rgba(255, 152, 162, 0.6)); }
        }
        @keyframes progressBarAnim {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .github-spin-icon {
          animation: spinKf 0.85s linear infinite !important;
        }
        .github-pulse-wrapper {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .github-progress-bar {
          animation: progressBarAnim 1.4s ease-in-out infinite;
        }
      `}</style>

      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={{ color: "#ff98a2" }}>Dev</span>Connect
        </div>

        {error ? (
          <div style={styles.errorBox}>
            <AlertCircle size={32} color="#ff6b6b" style={{ marginBottom: "12px" }} />
            <h2 style={styles.title}>Authentication Failed</h2>
            <p style={styles.desc}>{error}</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/login" style={styles.btn}>
                Return to Login
              </Link>
              {callbackMode === "connect_github" && (
                <Link to="/profile" style={{ ...styles.btn, background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                  Return to Profile
                </Link>
              )}
              <Link to="/register" style={{ ...styles.btn, background: "#fff", color: "#0a0a0c" }}>
                Register Here
              </Link>
            </div>
          </div>
        ) : status.includes("Success") ? (
          <div style={styles.successBox}>
            <CheckCircle2 size={36} color="#51cf66" style={{ marginBottom: "12px" }} />
            <h2 style={styles.title}>Connected!</h2>
            <p style={styles.desc}>{status}</p>
          </div>
        ) : (
          <div style={styles.loadingBox}>
            <div style={styles.spinnerWrapper} className="github-pulse-wrapper">
              <Loader2 size={36} color="#ff98a2" className="github-spin-icon" />
            </div>
            <h2 style={styles.title}>
              {callbackMode === "connect_github"
                ? "Connecting GitHub"
                : callbackMode === "register"
                ? "Creating Account"
                : "Signing In with GitHub"}
            </h2>
            <p style={styles.desc}>{status}</p>

            <div style={styles.progressBarTrack}>
              <div style={styles.progressBarFill} className="github-progress-bar" />
            </div>
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
    marginBottom: "20px",
  },
  spinnerWrapper: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "rgba(255, 152, 162, 0.08)",
    border: "1px solid rgba(255, 152, 162, 0.2)",
    marginBottom: "18px",
  },
  progressBarTrack: {
    width: "100%",
    height: "4px",
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: "4px",
    overflow: "hidden",
    position: "relative",
    marginTop: "8px",
  },
  progressBarFill: {
    width: "50%",
    height: "100%",
    background: "linear-gradient(90deg, #ff98a2, #e17a92, #ff98a2)",
    borderRadius: "4px",
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
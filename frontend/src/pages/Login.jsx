import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import FormField from "../components/FormField.jsx";
import OAuthButtons from "../components/OAuthButtons.jsx";
import SpecularButton from "../components/effects/SpecularButton.jsx";
import Magnet from "../components/effects/Magnet.jsx";
import ClickSpark from "../components/effects/ClickSpark.jsx";
import ShinyText from "../components/effects/ShinyText.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/workspace";

  const [form, setForm] = useState({ identifier: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.identifier.trim() || !form.password) {
      setError("Please enter your email or username and password.");
      return;
    }

    setLoading(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout activeTab="login">
      <div style={styles.header}>
        <h1 style={styles.title}>
          <ShinyText text="Welcome back" />
        </h1>
        <p style={styles.subtitle}>Sign in to continue to your workspace.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email or Username"
          type="text"
          autoComplete="username"
          placeholder="you@example.com or username"
          icon={Mail}
          value={form.identifier}
          onChange={update("identifier")}
          error={error ? " " : ""}
        />

        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={Lock}
          value={form.password}
          onChange={update("password")}
          error={error}
        />

        <div style={styles.optionsRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.remember}
              onChange={update("remember")}
              style={styles.checkbox}
            />
            Remember me
          </label>
          <a href="#" style={styles.forgotLink} onClick={(e) => e.preventDefault()}>
            Forgot password?
          </a>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={styles.btnWrap}>
          <Magnet padding={20} disabled={false} magnetStrength={3}>
            <ClickSpark
              sparkColor="#ff98a2"
              sparkSize={10}
              sparkRadius={15}
              sparkCount={8}
              duration={400}
            >
              <SpecularButton
                style={styles.submitBtn}
                ambientColor="rgba(255, 152, 162, 0.25)"
                reflectionColor="rgba(255, 255, 255, 0.4)"
                baseColor="#ff98a2"
                roughness={0.28}
                metalness={0.65}
                intensity={1.2}
                shineSize={15}
                shineFade={45}
                thickness={1}
                speed={0.35}
                followMouse
                proximity={250}
                autoAnimate={false}
                type="submit"
                disabled={loading}
              >
                <span style={styles.btnContent}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin-icon" style={styles.spinner} />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <span>Sign In →</span>
                  )}
                </span>
              </SpecularButton>
            </ClickSpark>
          </Magnet>
        </div>
      </form>


      <OAuthButtons onError={setError} onSuccess={() => navigate(redirectTo, { replace: true })} />

      <p style={styles.footerText}>
        Don't have an account?{" "}
        <Link to="/register" style={styles.link}>
          Sign up
        </Link>
      </p>

      <style>{`
        .spin-icon {
          animation: spin-kf 0.8s linear infinite;
        }
        @keyframes spin-kf {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AuthLayout>
  );
}

const styles = {
  header: {
    marginBottom: 22,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: "0 0 6px",
    color: "var(--text)",
  },
  subtitle: {
    fontFamily: "var(--font-body)",
    fontSize: 13.5,
    color: "var(--text-muted)",
    margin: 0,
    lineHeight: 1.4,
  },
  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: -4,
  },
  rememberLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--text-muted)",
    cursor: "pointer",
  },
  checkbox: {
    accentColor: "var(--coral)",
    cursor: "pointer",
    borderRadius: 4,
  },
  forgotLink: {
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--coral)",
    textDecoration: "none",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    background: "rgba(248, 113, 113, 0.12)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
    borderRadius: 10,
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--danger)",
    marginBottom: 16,
  },
  btnContent: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },
  spinner: {
    display: "inline-block",
  },
  footerText: {
    marginTop: 22,
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--text-muted)",
    textAlign: "center",
  },
  link: {
    color: "var(--coral)",
    textDecoration: "none",
    fontWeight: 600,
  },
};

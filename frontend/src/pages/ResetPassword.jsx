import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Loader2, KeyRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import SpecularButton from "../components/effects/SpecularButton.jsx";
import Magnet from "../components/effects/Magnet.jsx";
import ClickSpark from "../components/effects/ClickSpark.jsx";
import ShinyText from "../components/effects/ShinyText.jsx";
import { authApi } from "../lib/api.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeParams = useParams();

  const token = searchParams.get("token") || routeParams.token || "";
  const emailParam = searchParams.get("email") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState(emailParam);

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setError("No password reset token provided. Please request a new link.");
      return;
    }

    authApi
      .verifyResetToken(token)
      .then((res) => {
        if (!active) return;
        setTokenValid(true);
        if (res?.email) setAccountEmail(res.email);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setTokenValid(false);
        setError(err.message || "This password reset link is invalid or has expired.");
      })
      .finally(() => {
        if (active) setVerifying(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3500);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout activeTab="login">
      <div style={styles.header}>
        <h1 style={styles.title}>
          <ShinyText text="Create New Password" />
        </h1>
        <p style={styles.subtitle}>
          {accountEmail
            ? `Setting a new password for ${accountEmail}`
            : "Choose a secure password for your account."}
        </p>
      </div>

      {verifying ? (
        <div style={styles.centerState}>
          <Loader2 size={24} className="spin-icon" style={{ color: "var(--coral, #ff98a2)" }} />
          <p style={styles.verifyingText}>Verifying your reset link…</p>
        </div>
      ) : !tokenValid ? (
        <div style={styles.invalidState}>
          <div style={styles.errorBanner}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error || "Password reset token is invalid or expired."}</span>
          </div>

          <p style={styles.helperText}>
            Password reset links expire in 15 minutes for your security. Please request a fresh reset link.
          </p>

          <Link to="/login" style={styles.returnBtn}>
            Return to Sign In
          </Link>
        </div>
      ) : success ? (
        <div style={styles.successState}>
          <div style={styles.successIconWrap}>
            <CheckCircle2 size={36} color="#81c784" />
          </div>
          <h3 style={styles.successTitle}>Password Updated!</h3>
          <p style={styles.successMsg}>
            Your password has been changed successfully. You will be redirected to the sign in page in a moment.
          </p>
          <Link to="/login" style={styles.returnBtn}>
            <span>Sign In with New Password</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* New Password Field */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrap}>
              <Lock size={15} style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                style={styles.input}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.inputWrap}>
              <KeyRound size={15} style={styles.inputIcon} />
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                style={styles.input}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={styles.btnWrap}>
            <Magnet padding={20} disabled={false} magnetStrength={3}>
              <ClickSpark sparkColor="#ff98a2" sparkSize={10} sparkRadius={15} duration={400}>
                <SpecularButton
                  style={styles.submitBtn}
                  ambientColor="rgba(255, 152, 162, 0.25)"
                  reflectionColor="rgba(255, 255, 255, 0.4)"
                  baseColor="#ff98a2"
                  roughness={0.28}
                  metalness={0.65}
                  intensity={1.2}
                  type="submit"
                  disabled={submitting}
                >
                  <span style={styles.btnContent}>
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="spin-icon" />
                        <span>Updating Password…</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </span>
                </SpecularButton>
              </ClickSpark>
            </Magnet>
          </div>
        </form>
      )}

      <p style={styles.footerText}>
        Remember your password?{" "}
        <Link to="/login" style={styles.link}>
          Sign in
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
    fontFamily: "var(--font-display, system-ui, sans-serif)",
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: "0 0 6px",
    color: "var(--text, #f7f2e8)",
  },
  subtitle: {
    fontFamily: "var(--font-body, system-ui, sans-serif)",
    fontSize: 13.5,
    color: "var(--text-muted, #a1a1aa)",
    margin: 0,
    lineHeight: 1.4,
  },
  centerState: {
    padding: "36px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  verifyingText: {
    fontSize: "13.5px",
    color: "var(--text-muted, #a1a1aa)",
    margin: 0,
  },
  invalidState: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "8px 0 16px",
  },
  helperText: {
    fontSize: "12.5px",
    color: "var(--text-muted, #a1a1aa)",
    lineHeight: 1.5,
    margin: 0,
  },
  successState: {
    textAlign: "center",
    padding: "20px 8px 12px",
  },
  successIconWrap: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "rgba(129, 199, 132, 0.12)",
    border: "1px solid rgba(129, 199, 132, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  successTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#81c784",
    margin: "0 0 8px",
  },
  successMsg: {
    fontSize: "13px",
    color: "#d4d4d8",
    lineHeight: 1.5,
    margin: "0 0 20px",
  },
  fieldWrap: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text, #f7f2e8)",
    marginBottom: "6px",
    letterSpacing: "0.01em",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "var(--text-muted, #a1a1aa)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "11px 40px 11px 38px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    color: "var(--text, #f7f2e8)",
    fontSize: "13.5px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.18s ease, background 0.18s ease",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    background: "transparent",
    border: "none",
    color: "var(--text-muted, #a1a1aa)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    background: "rgba(248, 113, 113, 0.12)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--danger, #f87171)",
    marginBottom: 16,
  },
  btnWrap: {
    marginTop: 20,
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: 10,
    cursor: "pointer",
  },
  btnContent: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
  },
  returnBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "11px 18px",
    background: "var(--coral, #ff98a2)",
    color: "#160809",
    borderRadius: "10px",
    fontSize: "13.5px",
    fontWeight: 700,
    textDecoration: "none",
    textAlign: "center",
    width: "100%",
  },
  footerText: {
    marginTop: 22,
    fontSize: 13,
    color: "var(--text-muted, #a1a1aa)",
    textAlign: "center",
  },
  link: {
    color: "var(--coral, #ff98a2)",
    textDecoration: "none",
    fontWeight: 600,
  },
};

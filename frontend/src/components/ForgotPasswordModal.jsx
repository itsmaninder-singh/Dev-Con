import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mail, ArrowRight, X, AlertCircle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/api.js";
import FormField from "./FormField.jsx";
import SpecularButton from "./effects/SpecularButton.jsx";
import Magnet from "./effects/Magnet.jsx";
import ClickSpark from "./effects/ClickSpark.jsx";
import ShinyText from "./effects/ShinyText.jsx";

export default function ForgotPasswordModal({ isOpen, onClose, initialIdentifier = "" }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIdentifier(initialIdentifier || "");
      setError("");
      setSuccessData(null);
    }
  }, [isOpen, initialIdentifier]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your registered email address or username.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await authApi.forgotPassword(identifier.trim());
      setSuccessData(res.data || res || { success: true });
    } catch (err) {
      setError(err.message || "Failed to process request. Please verify your email or username.");
    } finally {
      setLoading(false);
    }
  };

  const handleDevNavigate = (url) => {
    onClose();
    if (url.startsWith("http")) {
      const parsed = new URL(url);
      navigate(parsed.pathname + parsed.search);
    } else {
      navigate(url);
    }
  };

  return createPortal(
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <Mail size={22} color="var(--coral, #ff98a2)" />
          </div>
          <h2 style={styles.title}>
            <ShinyText text="Reset Your Password" />
          </h2>
          <p style={styles.subtitle}>
            Enter your registered email or username and we'll send you instructions to reset your password.
          </p>
        </div>

        {successData ? (
          <div style={styles.successBox}>
            <div style={styles.successHeader}>
              <CheckCircle2 size={24} color="#81c784" />
              <div>
                <h4 style={styles.successTitle}>Instructions Dispatched!</h4>
                <p style={styles.successDesc}>
                  We've sent a password reset link to{" "}
                  <strong>{successData.email || identifier}</strong>. It will expire in 15 minutes.
                </p>
              </div>
            </div>

            {successData.devResetUrl && (
              <div style={styles.devBox}>
                <span style={styles.devBadge}>Dev Shortcut</span>
                <p style={styles.devText}>
                  Development mode active: click below to open the reset page directly without opening your email client.
                </p>
                <button
                  type="button"
                  style={styles.devLinkBtn}
                  onClick={() => handleDevNavigate(successData.devResetUrl)}
                >
                  <span>Open Reset Link</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            )}

            <button type="button" style={styles.doneBtn} onClick={onClose}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Email or Username"
              type="text"
              autoComplete="username"
              placeholder="you@example.com or username"
              icon={Mail}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError("");
              }}
              error={error ? " " : ""}
            />

            {error && (
              <div style={styles.errorBanner}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.actions}>
              <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={loading}>
                Cancel
              </button>

              <div style={{ flex: 1 }}>
                <Magnet padding={15} disabled={false} magnetStrength={2}>
                  <ClickSpark sparkColor="#ff98a2" sparkSize={8} duration={350}>
                    <SpecularButton
                      style={styles.submitBtn}
                      ambientColor="rgba(255, 152, 162, 0.25)"
                      reflectionColor="rgba(255, 255, 255, 0.4)"
                      baseColor="#ff98a2"
                      roughness={0.28}
                      metalness={0.65}
                      intensity={1.2}
                      type="submit"
                      disabled={loading}
                    >
                      <span style={styles.btnContent}>
                        {loading ? (
                          <>
                            <Loader2 size={15} className="spin-icon" />
                            <span>Sending link…</span>
                          </>
                        ) : (
                          <>
                            <span>Send Link</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </span>
                    </SpecularButton>
                  </ClickSpark>
                </Magnet>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "rgba(18, 19, 21, 0.96)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "18px",
    padding: "28px 24px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 152, 162, 0.15)",
    color: "#f7f2e8",
    fontFamily: "var(--font-body, system-ui, sans-serif)",
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#a1a1aa",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  header: {
    textAlign: "center",
    marginBottom: "22px",
  },
  iconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(255, 152, 162, 0.1)",
    border: "1px solid rgba(255, 152, 162, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
  },
  title: {
    fontFamily: "var(--font-display, system-ui, sans-serif)",
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--text-muted, #a1a1aa)",
    lineHeight: 1.45,
    margin: 0,
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    background: "rgba(248, 113, 113, 0.12)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: 500,
    color: "var(--danger, #f87171)",
    marginBottom: "16px",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "20px",
  },
  cancelBtn: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    color: "#a1a1aa",
    padding: "10px 16px",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  submitBtn: {
    width: "100%",
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  btnContent: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "13.5px",
    fontWeight: 700,
  },
  successBox: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  successHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    background: "rgba(129, 199, 132, 0.1)",
    border: "1px solid rgba(129, 199, 132, 0.25)",
    borderRadius: "12px",
  },
  successTitle: {
    margin: "0 0 4px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#81c784",
  },
  successDesc: {
    margin: 0,
    fontSize: "12.5px",
    color: "#d4d4d8",
    lineHeight: 1.45,
  },
  devBox: {
    padding: "12px",
    background: "rgba(255, 152, 162, 0.08)",
    border: "1px dashed rgba(255, 152, 162, 0.35)",
    borderRadius: "10px",
  },
  devBadge: {
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "2px 6px",
    background: "rgba(255, 152, 162, 0.25)",
    color: "#ff98a2",
    borderRadius: "4px",
    display: "inline-block",
    marginBottom: "6px",
  },
  devText: {
    fontSize: "11.5px",
    color: "#a1a1aa",
    margin: "0 0 10px",
    lineHeight: 1.4,
  },
  devLinkBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    background: "var(--coral, #ff98a2)",
    color: "#160809",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  doneBtn: {
    width: "100%",
    padding: "10px",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    color: "#f7f2e8",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
};

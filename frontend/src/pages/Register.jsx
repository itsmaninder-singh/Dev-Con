import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, AtSign, Mail, Lock, Phone, AlertCircle, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import FormField from "../components/FormField.jsx";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator.jsx";
import OAuthButtons from "../components/OAuthButtons.jsx";
import SpecularButton from "../components/effects/SpecularButton.jsx";
import Magnet from "../components/effects/Magnet.jsx";
import ClickSpark from "../components/effects/ClickSpark.jsx";
import ShinyText from "../components/effects/ShinyText.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  phoneNumber: "",
  terms: true,
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({
      ...f,
      [key]: val,
    }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      errs.name = "Full name is required";
    } else if (nameTrimmed.length < 2) {
      errs.name = "Full name must be at least 2 characters";
    }

    const userTrimmed = form.username.trim();
    if (!userTrimmed) {
      errs.username = "Username is required";
    } else if (userTrimmed.length < 3 || userTrimmed.length > 30) {
      errs.username = "Username must be between 3 and 30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(userTrimmed)) {
      errs.username = "Invalid username! Only letters, numbers, and underscores are allowed";
    }

    const emailTrimmed = form.email.trim().toLowerCase();
    if (!emailTrimmed) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = "Invalid email format! Please enter a valid email (e.g. user@gmail.com)";
    } else if (emailTrimmed.includes("@gmail") && !/@gmail\.com$/i.test(emailTrimmed)) {
      errs.email = "Invalid gmail! Please check your email domain (e.g. @gmail.com)";
    }

    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters long";
    }

    if (!form.terms) {
      errs.terms = "Please accept the terms to create an account";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const { phoneNumber, terms, ...rest } = form;
      const payload = phoneNumber.trim() ? { ...rest, phoneNumber } : rest;
      await register(payload);
      navigate(nextParam || "/workspace", { replace: true });
    } catch (err) {
      const errMsg = err.message || "Registration failed. Please try again.";
      setError(errMsg);

      const newFieldErrors = {};
      const lower = errMsg.toLowerCase();
      if (lower.includes("email") || lower.includes("gmail")) {
        newFieldErrors.email = errMsg;
      }
      if (lower.includes("username")) {
        newFieldErrors.username = errMsg;
      }
      if (lower.includes("password")) {
        newFieldErrors.password = errMsg;
      }
      if (lower.includes("name") && !lower.includes("username")) {
        newFieldErrors.name = errMsg;
      }
      if (lower.includes("phone")) {
        newFieldErrors.phoneNumber = errMsg;
      }
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout activeTab="register">
      <div style={styles.header}>
        <h1 style={styles.title}>
          <ShinyText text="Create an account" />
        </h1>
        <p style={styles.subtitle}>Get started with DevConnect in less than two minutes.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={styles.gridTwo}>
          <FormField
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            icon={User}
            value={form.name}
            onChange={update("name")}
            error={fieldErrors.name}
          />
          <FormField
            label="Username"
            type="text"
            placeholder="Choose a username"
            autoComplete="off"
            icon={AtSign}
            value={form.username}
            onChange={update("username")}
            error={fieldErrors.username}
          />
        </div>

        <FormField
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          icon={Mail}
          value={form.email}
          onChange={update("email")}
          error={fieldErrors.email}
        />

        <FormField
          label="Password"
          type="password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          icon={Lock}
          value={form.password}
          onChange={update("password")}
          error={fieldErrors.password}
        />

        {/* Live Password Strength Visualizer */}
        <PasswordStrengthIndicator password={form.password} />

        <FormField
          label="Phone Number (Optional)"
          type="tel"
          placeholder="Enter your phone number"
          autoComplete="tel"
          icon={Phone}
          value={form.phoneNumber}
          onChange={update("phoneNumber")}
        />

        <div style={styles.termsRow}>
          <label style={styles.termsLabel}>
            <input
              type="checkbox"
              checked={form.terms}
              onChange={update("terms")}
              style={styles.checkbox}
            />
            <span>
              I agree to the <span style={{ color: "var(--coral)", fontWeight: 600 }}>Terms of Service</span> and{" "}
              <span style={{ color: "var(--coral)", fontWeight: 600 }}>Privacy Policy</span>.
            </span>
          </label>
          {fieldErrors.terms && <span style={styles.termsError}>{fieldErrors.terms}</span>}
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={15} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <Magnet pull={0.15}>
            <ClickSpark sparkColor="#ff98a2" style={{ width: "100%" }}>
              <SpecularButton
                size="lg"
                radius={12}
                tint="#ffffff"
                tintOpacity={0.05}
                blur={0}
                textColor="#f5f5f5"
                lineColor="#ffffff"
                baseColor="#202028"
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
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <span>Create Account →</span>
                  )}
                </span>
              </SpecularButton>
            </ClickSpark>
          </Magnet>
        </div>
      </form>

      <OAuthButtons
        mode="register"
        onError={setError}
        onSuccess={(loggedUser) => {
          if (loggedUser && !loggedUser.isProfileComplete) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate(nextParam || "/workspace", { replace: true });
          }
        }}
      />

      <p style={styles.footerText}>
        Already have an account?{" "}
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
    marginBottom: 20,
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
    fontSize: 13,
    color: "var(--text-muted)",
    margin: 0,
    lineHeight: 1.4,
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  termsRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 16,
    marginTop: -4,
  },
  termsLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontFamily: "var(--font-body)",
    fontSize: 11.5,
    color: "var(--text-muted)",
    cursor: "pointer",
    lineHeight: 1.4,
  },
  checkbox: {
    accentColor: "var(--coral)",
    cursor: "pointer",
    borderRadius: 4,
    marginTop: 2,
  },
  termsError: {
    fontFamily: "var(--font-body)",
    fontSize: 11.5,
    fontWeight: 500,
    color: "var(--danger)",
    marginLeft: 22,
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

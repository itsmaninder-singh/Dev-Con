import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function FormField({
  label,
  type = "text",
  error,
  icon: Icon,
  hint,
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div style={styles.wrap}>
      <div style={styles.labelRow}>
        <label style={styles.label}>{label}</label>
        {hint && <span style={styles.hint}>{hint}</span>}
      </div>

      <div
        style={{
          ...styles.inputContainer,
          borderColor: error
            ? "var(--danger)"
            : isFocused
            ? "var(--coral)"
            : "var(--border)",
          boxShadow: isFocused
            ? error
              ? "0 0 0 3px rgba(248, 113, 113, 0.2)"
              : "0 0 0 3px rgba(255, 152, 162, 0.15), 0 0 15px rgba(255, 152, 162, 0.1)"
            : "none",
        }}
      >
        {Icon && (
          <div style={styles.iconWrap}>
            <Icon
              size={16}
              color={error ? "var(--danger)" : isFocused ? "var(--coral)" : "var(--text-dim)"}
            />
          </div>
        )}

        <input
          {...inputProps}
          type={actualType}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={{
            ...styles.input,
            paddingLeft: Icon ? 38 : 14,
            paddingRight: isPassword ? 38 : 14,
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={styles.eyeBtn}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={16} color="var(--text-muted)" />
            ) : (
              <Eye size={16} color="var(--text-muted)" />
            )}
          </button>
        )}
      </div>

      {error && <span style={styles.error}>{error}</span>}
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 16,
    position: "relative",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    letterSpacing: "-0.01em",
  },
  hint: {
    fontFamily: "var(--font-body)",
    fontSize: 11.5,
    color: "var(--text-dim)",
  },
  inputContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "rgba(18, 18, 24, 0.75)",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    overflow: "hidden",
  },
  iconWrap: {
    position: "absolute",
    left: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    zIndex: 2,
  },
  input: {
    width: "100%",
    height: 44,
    padding: "0 14px",
    background: "transparent",
    border: "none",
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    outline: "none",
    zIndex: 1,
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    borderRadius: 6,
    transition: "opacity 0.15s ease",
  },
  error: {
    fontFamily: "var(--font-body)",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--danger)",
    marginTop: 2,
  },
};

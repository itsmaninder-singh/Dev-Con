import { Check, X } from "lucide-react";

export default function PasswordStrengthIndicator({ password }) {
  if (!password) return null;

  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  const getStrengthMeta = () => {
    switch (score) {
      case 0:
      case 1:
        return { label: "Weak", color: "#f87171", pct: 25 };
      case 2:
        return { label: "Fair", color: "#fbbf24", pct: 50 };
      case 3:
        return { label: "Good", color: "#60a5fa", pct: 75 };
      case 4:
        return { label: "Strong", color: "#34d399", pct: 100 };
      default:
        return { label: "Weak", color: "#f87171", pct: 25 };
    }
  };

  const meta = getStrengthMeta();

  return (
    <div style={styles.container}>
      <div style={styles.meterHeader}>
        <span style={styles.meterLabel}>Password strength</span>
        <span style={{ ...styles.strengthTag, color: meta.color }}>
          {meta.label}
        </span>
      </div>

      <div style={styles.barBg}>
        <div
          style={{
            ...styles.barFill,
            width: `${meta.pct}%`,
            backgroundColor: meta.color,
            boxShadow: `0 0 10px ${meta.color}66`,
          }}
        />
      </div>

      <div style={styles.criteriaGrid}>
        {checks.map((item, idx) => (
          <div
            key={idx}
            style={{
              ...styles.criterion,
              color: item.met ? "#34d399" : "var(--text-dim)",
            }}
          >
            {item.met ? <Check size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2.5} />}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: -8,
    marginBottom: 16,
    padding: "10px 12px",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  meterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  meterLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-muted)",
  },
  strengthTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  barBg: {
    width: "100%",
    height: 4,
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  criteriaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 8px",
  },
  criterion: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    transition: "color 0.2s ease",
  },
};

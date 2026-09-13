import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

/* ─── Context ─────────────────────────────────────────────────── */
const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let _id = 0;

/* ─── Provider ────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 350);
  }, []);

  const toast = useCallback(
    ({ message, type = "info", duration = 3500 }) => {
      const id = ++_id;
      setToasts((t) => [...t, { id, message, type, leaving: false }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

/* ─── Stack UI ────────────────────────────────────────────────── */
function ToastStack({ toasts, dismiss }) {
  return (
    <div style={styles.stack}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, dismiss }) {
  const meta = {
    success: { icon: <Check size={15} />, color: "#34d399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.3)" },
    error:   { icon: <AlertCircle size={15} />, color: "#f87171", bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.3)" },
    info:    { icon: <Info size={15} />, color: "#ff98a2", bg: "rgba(255, 152, 162, 0.10)", border: "rgba(255, 152, 162, 0.28)" },
  }[toast.type] ?? {};

  return (
    <div
      style={{
        ...styles.toast,
        background: meta.bg,
        borderColor: meta.border,
        color: meta.color,
        opacity: toast.leaving ? 0 : 1,
        transform: toast.leaving ? "translateY(12px) scale(0.96)" : "translateY(0) scale(1)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <span style={{ flexShrink: 0 }}>{meta.icon}</span>
      <span style={styles.msg}>{toast.message}</span>
      <button type="button" onClick={() => dismiss(toast.id)} style={styles.closeBtn}>
        <X size={13} />
      </button>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const styles = {
  stack: {
    position: "fixed",
    bottom: 28,
    right: 24,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "none",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 16px 40px -12px rgba(0,0,0,0.7)",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13.5,
    fontWeight: 500,
    maxWidth: 360,
    pointerEvents: "auto",
    cursor: "default",
  },
  msg: {
    flex: 1,
    lineHeight: 1.4,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    opacity: 0.6,
    padding: 2,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
};

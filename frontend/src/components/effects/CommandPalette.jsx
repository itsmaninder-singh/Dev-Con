import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Users, FolderOpen, Settings, User, Compass, Home, X } from "lucide-react";

/* ─── Context ─────────────────────────────────────────────────── */
const CmdKCtx = createContext(null);

export function useCmdK() {
  return useContext(CmdKCtx);
}

/* ─── Provider (wrap App with this) ──────────────────────────── */
export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close  = useCallback(() => setOpen(false), []);

  // Cmd+K / Ctrl+K global listener
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, close]);

  return (
    <CmdKCtx.Provider value={{ open, toggle, close }}>
      {children}
      {open && <CommandPaletteModal close={close} />}
    </CmdKCtx.Provider>
  );
}

/* ─── Command Registry ────────────────────────────────────────── */
const ALL_COMMANDS = [
  { id: "home",       label: "Home",            path: "/",               icon: Home,     group: "Pages" },
  { id: "explore",    label: "Explore",          path: "/explore",        icon: Compass,  group: "Pages" },
  { id: "profile",    label: "My Profile",       path: "/profile",        icon: User,     group: "Pages" },
  { id: "settings",   label: "Settings",         path: "/settings",       icon: Settings, group: "Pages" },
  { id: "requests",   label: "Join Requests",    path: "/join-requests",  icon: Users,    group: "Pages" },
  { id: "teams",      label: "Teams",            path: "/teams/1",        icon: Users,    group: "Pages" },
  { id: "projects",   label: "Projects",         path: "/projects/1",     icon: FolderOpen, group: "Pages" },
  { id: "c-team",     label: "Create a Team",    path: "/teams/create",   icon: Users,    group: "Actions" },
  { id: "c-project",  label: "Create a Project", path: "/projects/create",icon: FolderOpen, group: "Actions" },
];

/* ─── Modal ───────────────────────────────────────────────────── */
function CommandPaletteModal({ close }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? ALL_COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_COMMANDS;

  // Reset active index when filtered list changes
  useEffect(() => setActiveIdx(0), [query]);

  const go = (cmd) => {
    navigate(cmd.path);
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIdx]) {
      go(filtered[activeIdx]);
    }
  };

  // Group items for rendering
  const groups = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  let globalIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div onClick={close} style={styles.backdrop} />

      {/* Modal */}
      <div style={styles.modal} role="dialog" aria-modal="true" aria-label="Command palette">
        {/* Search Input */}
        <div style={styles.searchRow}>
          <Search size={16} color="#7a7d81" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, actions, teams..."
            style={styles.input}
            spellCheck={false}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} style={styles.clearBtn}>
              <X size={14} />
            </button>
          )}
          <kbd style={styles.escKbd}>ESC</kbd>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Results */}
        <div style={styles.results}>
          {filtered.length === 0 ? (
            <div style={styles.empty}>No results for "{query}"</div>
          ) : (
            Object.entries(groups).map(([group, cmds]) => (
              <div key={group}>
                <div style={styles.groupLabel}>{group}</div>
                {cmds.map((cmd) => {
                  const idx = globalIdx++;
                  const isActive = idx === activeIdx;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => go(cmd)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      style={{
                        ...styles.item,
                        background: isActive ? "rgba(255, 152, 162, 0.10)" : "transparent",
                        borderColor: isActive ? "rgba(255, 152, 162, 0.25)" : "transparent",
                      }}
                    >
                      <span style={{ ...styles.itemIcon, color: isActive ? "#ff98a2" : "#7a7d81" }}>
                        <Icon size={15} />
                      </span>
                      <span style={{ ...styles.itemLabel, color: isActive ? "#f2f1ed" : "#c7c8ca" }}>
                        {cmd.label}
                      </span>
                      <span style={styles.itemGroup}>{cmd.group}</span>
                      {isActive && (
                        <ArrowRight size={13} color="#ff98a2" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerHint}><kbd style={styles.kbd}>↑↓</kbd> navigate</span>
          <span style={styles.footerHint}><kbd style={styles.kbd}>↵</kbd> open</span>
          <span style={styles.footerHint}><kbd style={styles.kbd}>ESC</kbd> close</span>
        </div>
      </div>
    </>
  );
}

/* ─── Trigger Button (put in AppNavbar) ──────────────────────── */
export function CmdKTrigger() {
  const { toggle } = useCmdK();
  return (
    <button type="button" onClick={toggle} style={styles.trigger} title="Command palette (Ctrl+K)">
      <Search size={14} color="#7a7d81" />
      <span style={styles.triggerText}>Search…</span>
      <kbd style={styles.triggerKbd}>⌘K</kbd>
    </button>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 998,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },
  modal: {
    position: "fixed",
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 999,
    width: "min(600px, 92vw)",
    background: "rgba(12, 12, 15, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    boxShadow: "0 40px 100px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,152,162,0.08)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    overflow: "hidden",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px 18px",
  },
  input: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#f2f1ed",
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
    lineHeight: 1,
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#7a7d81",
    display: "flex",
    alignItems: "center",
    padding: 2,
  },
  escKbd: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#7a7d81",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 5,
    padding: "2px 6px",
    background: "rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
  },
  results: {
    maxHeight: 360,
    overflowY: "auto",
    padding: "8px",
  },
  groupLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "1.5px",
    color: "#7a7d81",
    textTransform: "uppercase",
    padding: "10px 12px 4px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "left",
  },
  itemIcon: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  itemLabel: {
    flex: 1,
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 500,
  },
  itemGroup: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#7a7d81",
    flexShrink: 0,
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#7a7d81",
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
  },
  footer: {
    display: "flex",
    gap: 16,
    padding: "10px 18px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  footerHint: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10.5,
    color: "#7a7d81",
  },
  kbd: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9.5,
    color: "#c7c8ca",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 4,
    padding: "1px 5px",
    background: "rgba(255,255,255,0.04)",
  },
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  triggerText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#7a7d81",
  },
  triggerKbd: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#7a7d81",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 5,
    padding: "1px 5px",
    background: "rgba(255,255,255,0.04)",
  },
};

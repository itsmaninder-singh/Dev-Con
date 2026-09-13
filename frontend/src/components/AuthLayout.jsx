import { Link } from "react-router-dom";
import Antigravity from "./effects/Antigravity.jsx";
import MagicBento from "./effects/MagicBento.jsx";
import StarBorder from "./effects/StarBorder.jsx";
import ShinyText from "./effects/ShinyText.jsx";
import Noise from "./effects/Noise.jsx";

export default function AuthLayout({ activeTab, children }) {
  return (
    <div style={styles.page}>
      <Noise opacity={0.03} />

      <div style={styles.antigravityWrap}>
        <Antigravity
          count={260}
          magnetRadius={6}
          ringRadius={7}
          waveSpeed={0.3}
          waveAmplitude={0.8}
          particleSize={1.2}
          lerpSpeed={0.05}
          color="#ff98a2"
          autoAnimate
          particleVariance={1}
        />
      </div>

      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <span style={styles.brandTitle}>
            Dev<span style={{ color: "var(--coral)" }}>Connect</span>
          </span>
        </div>
      </nav>

      {/* Left Panel: Clean & Massive Bold Typography */}
      <div style={styles.leftPanel}>
        <div style={styles.brand}>
         <h1 style={styles.brandHeading}>
  <ShinyText
    text="Build Your Dream Team."
    as="span"
    style={{ display: "block" }}
  />

  <span style={{ color: "var(--coral)", display: "block" }}>
    Ship Faster Together.
  </span>
</h1>
        </div>
      </div>

      {/* Right Panel: Form Card with StarBorder + MagicBento */}
      <div style={styles.rightPanel}>
        <div style={styles.cardWrap}>
          <StarBorder color="#ff98a2" speed="8s" radius={18}>
            <MagicBento
              textAutoHide
              enableStars
              enableSpotlight
              enableBorderGlow
              enableTilt
              enableMagnetism
              clickEffect
              spotlightRadius={300}
              particleCount={10}
              glowColor="255, 152, 162"
            >
              <div style={styles.terminalBar}>
                <div style={styles.dots}>
                  <span style={{ ...styles.dot, background: "#ff5f57" }} />
                  <span style={{ ...styles.dot, background: "#febc2e" }} />
                  <span style={{ ...styles.dot, background: "#28c840" }} />
                </div>

                <div style={styles.tabs}>
                  <Link
                    to="/login"
                    style={{
                      ...styles.tab,
                      ...(activeTab === "login" ? styles.tabActive : null),
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    style={{
                      ...styles.tab,
                      ...(activeTab === "register" ? styles.tabActive : null),
                    }}
                  >
                    Register
                  </Link>
                </div>
              </div>

              <div style={styles.cardBody}>{children}</div>
            </MagicBento>
          </StarBorder>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.15fr 1fr",
    background: "var(--bg)",
    overflow: "hidden",
  },
  antigravityWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    opacity: 0.55,
    pointerEvents: "none",
  },
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 5%",
    background: "rgba(7, 7, 9, 0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border)",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
  },
  brandTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "var(--text)",
  },
  navBack: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-muted)",
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.03)",
    transition: "all 0.2s ease",
  },
  leftPanel: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "90px 48px 48px",
  },
  brand: {
    position: "relative",
    zIndex: 1,
    maxWidth: 700,
    margin: "0 auto",
    textAlign: "center",
  },
  brandHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(46px, 4.8vw, 68px)",
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    margin: 0,
    color: "var(--text)",
    textAlign: "center",
  },
  rightPanel: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 32px 40px",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 450,
  },
  terminalBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(10, 10, 14, 0.6)",
  },
  dots: {
    display: "flex",
    gap: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    display: "inline-block",
  },
  tabs: {
    display: "flex",
    gap: 4,
    background: "rgba(255, 255, 255, 0.03)",
    padding: 3,
    borderRadius: 8,
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  tab: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-muted)",
    padding: "5px 16px",
    borderRadius: 6,
    transition: "all 0.2s ease",
  },
  tabActive: {
    color: "#fff",
    background: "rgba(255, 152, 162, 0.22)",
    boxShadow: "0 0 12px rgba(255, 152, 162, 0.15)",
    fontWeight: 600,
  },
  cardBody: {
    padding: "28px 28px 32px",
  },
};

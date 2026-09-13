import {
  Code2, Terminal, Cpu, Database, Globe, Layers,
  GitBranch, Server, Box, Sparkles, Wrench, Flame
} from "lucide-react";

const TOOLS = [
  { Icon: Code2, color: "#61DAFB" },
  { Icon: Server, color: "#68A063" },
  { Icon: Terminal, color: "#3776AB" },
  { Icon: Code2, color: "#3178C6" },
  { Icon: Layers, color: "#2496ED" },
  { Icon: Sparkles, color: "#ff98a2" },
  { Icon: Database, color: "#47A248" },
  { Icon: Box, color: "#ffffff" },
  { Icon: Database, color: "#336791" },
  { Icon: Globe, color: "#06B6D4" },
  { Icon: Flame, color: "#EE4C2C" },
  { Icon: Database, color: "#DC382D" },
  { Icon: GitBranch, color: "#F05032" },
  { Icon: Cpu, color: "#CE422B" },
  { Icon: Wrench, color: "#f9c74f" },
];

// Quadruple for seamless loop at any width
const QUAD = [...TOOLS, ...TOOLS, ...TOOLS, ...TOOLS];

export default function LogoLoop({ cycleDuration = 10 }) {
  const dur  = cycleDuration;
  const dur2 = cycleDuration * 1.3;

  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.fade, left: 0, background: "linear-gradient(to right, #050506, transparent)" }} />

      {/* Row 1 — left */}
      <div style={{ ...styles.track, animationName: "lLeft", animationDuration: `${dur}s` }}>
        {QUAD.map(({ Icon, color }, i) => (
          <Circle key={`A${i}`} Icon={Icon} color={color} />
        ))}
      </div>

      {/* Row 2 — right, slightly different speed */}
      <div style={{ ...styles.track, animationName: "lRight", animationDuration: `${dur2}s`, marginTop: 12 }}>
        {[...QUAD].reverse().map(({ Icon, color }, i) => (
          <Circle key={`B${i}`} Icon={Icon} color={color} />
        ))}
      </div>

      <div style={{ ...styles.fade, right: 0, background: "linear-gradient(to left, #050506, transparent)" }} />

      <style>{`
        @keyframes lLeft {
          from { transform: translateX(0); }
          to   { transform: translateX(-25%); }
        }
        @keyframes lRight {
          from { transform: translateX(-25%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function Circle({ Icon, color }) {
  return (
    <div style={styles.circle}>
      <Icon size={22} color={color} />
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    padding: "16px 0",
  },
  track: {
    display: "flex",
    gap: 14,
    width: "max-content",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    willChange: "transform",
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
    zIndex: 2,
    pointerEvents: "none",
  },
};

import { useState, useRef, useEffect } from "react";
import { Check, X, Users, MessageCircle, Menu, Lock } from "lucide-react";

const STATUS_COPY = {
  running: "Running",
  open: "Open to join",
  closed: "Closed",
};

export default function ProjectPage() {
  const [activeTab, setActiveTab] = useState("team");
  const [navOpen, setNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // hero 3D tilt
  const heroRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: "50%", my: "50%" });

  // team entity state
  const [team, setTeam] = useState({
    name: "Nightowl",
    tagline: "Study-group matcher for late-night coders",
    desc: "A small team building a matching tool that pairs students working late on the same problem sets. Currently in build phase, backend routes mostly done.",
    status: "running",
  });
  const [draft, setDraft] = useState(team);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [members, setMembers] = useState([
    { id: "pn", initials: "PN", name: "Priya Nair", subtitle: "You", role: "admin" },
    { id: "am", initials: "AM", name: "Arjun Mehta", subtitle: "Backend", role: "member" },
    { id: "si", initials: "SI", name: "Sana Iyer", subtitle: "Frontend", role: "member" },
  ]);
  const [confirmingId, setConfirmingId] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());

  const [requests, setRequests] = useState([
    { id: "rd", initials: "RD", name: "Rohan Das", note: '"Worked with Socket.io before, would love to help on the backend."' },
  ]);

  // visitor / project join state
  const [joinMessage, setJoinMessage] = useState("");
  const [joinSending, setJoinSending] = useState(false);
  const [joinSent, setJoinSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  function handleMouseMove(e) {
    const r = heroRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: (0.5 - py) * 8, ry: (px - 0.5) * 10, mx: px * 100 + "%", my: py * 100 + "%" });
  }
  function handleMouseLeave() {
    setTilt((t) => ({ ...t, rx: 0, ry: 0 }));
  }

  function openEdit() {
    setDraft(team);
    setEditing(true);
  }
  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setTeam(draft);
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    }, 550);
  }

  function requestRemove(id) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      setTimeout(() => setConfirmingId((c) => (c === id ? null : c)), 2500);
      return;
    }
    setConfirmingId(null);
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => setMembers((prev) => prev.filter((m) => m.id !== id)), 260);
  }

  function acceptRequest(req) {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setMembers((prev) => [...prev, { id: req.id, initials: req.initials, name: req.name, subtitle: "Member", role: "member" }]);
  }
  function declineRequest(id) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  function handleJoin() {
    setJoinSending(true);
    setTimeout(() => {
      setJoinSending(false);
      setJoinSent(true);
    }, 550);
  }

  const statusClass = "status-" + team.status;

  return (
    <div className="dc-root">
      <style>{`
        .dc-root{ --bg:#000; --bg2:#1c1c1e; --bg3:#2c2c2e; --bg4:#3a3a3c;
          --sep:rgba(84,84,88,0.48); --label:#f5f5f7; --label2:rgba(235,235,245,0.64); --label3:rgba(235,235,245,0.36);
          --accent:#ff98a2; --accent-tint:rgba(255,152,162,0.16); --accent2:#ffc98e;
          --green:#ff98a2; --green-tint:rgba(255,152,162,0.14); --red:#ff453a; --red-tint:rgba(255,69,58,0.14);
          --orange:#ff9f0a; --radius:14px; --spring:cubic-bezier(0.32,0.72,0,1);
          --font:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;
          background:var(--bg); color:var(--label); font-family:var(--font); min-height:100vh; position:relative; overflow:hidden;
          -webkit-font-smoothing:antialiased;
        }
        .dc-root *{ box-sizing:border-box; }
        .dc-ambient{ position:absolute; top:-30%; left:50%; width:1100px; height:1100px; transform:translateX(-50%);
          background:radial-gradient(circle, rgba(255,201,142,0.16) 0%, rgba(255,152,162,0.08) 35%, transparent 65%); pointer-events:none; }
        .dc-nav{ position:relative; z-index:5; display:flex; align-items:center; justify-content:space-between; padding:14px 5%;
          background:rgba(20,20,22,0.72); backdropFilter:blur(20px); border-bottom:1px solid var(--sep); }
        .dc-brand{ font-weight:600; letter-spacing:-0.01em; font-size:17px; }
        .dc-brand span{ color:var(--accent); }
        .dc-links{ display:flex; gap:26px; list-style:none; margin:0; padding:0; }
        .dc-links a{ font-size:14px; color:var(--label2); font-weight:500; cursor:pointer; }
        .dc-links a.active{ color:var(--label); }
        .dc-menu-btn{ display:none; width:34px; height:34px; border:none; border-radius:9px; background:var(--bg3); color:var(--label); cursor:pointer; align-items:center; justify-content:center; }
        @media (max-width:760px){
          .dc-links{ position:absolute; top:58px; left:0; right:0; flex-direction:column; gap:0; background:rgba(20,20,22,0.96); border-bottom:1px solid var(--sep); max-height:0; overflow:hidden; transition:max-height 0.35s var(--spring); }
          .dc-links.open{ max-height:280px; }
          .dc-links li a{ padding:15px 5%; border-top:1px solid var(--sep); display:block; }
          .dc-menu-btn{ display:flex; }
        }
        .dc-wrap{ position:relative; z-index:1; max-width:640px; margin:0 auto; padding:48px 6% 80px; }
        .dc-hero-stage{ perspective:1200px; opacity:0; transform:translateY(16px); transition:opacity 0.6s var(--spring), transform 0.6s var(--spring); }
        .dc-hero-stage.mounted{ opacity:1; transform:translateY(0); }
        .dc-hero-tilt{ position:relative; border-radius:22px; padding:32px 34px 28px;
          background:linear-gradient(155deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02) 55%), var(--bg2);
          border:1px solid var(--sep); transform-style:preserve-3d; transition:transform 0.5s var(--spring); overflow:hidden; }
        .dc-sheen{ position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity 0.3s ease; mix-blend-mode:overlay; }
        .dc-hero-tilt:hover .dc-sheen{ opacity:1; }
        .dc-hero-mark{ width:44px; height:44px; border-radius:12px; margin-bottom:16px; background:linear-gradient(155deg, var(--accent), var(--accent2));
          display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px -6px rgba(255,152,162,0.5); transform:translateZ(30px); color:#0a0a0a; }
        .dc-hero-tilt h1{ font-size:28px; font-weight:700; letter-spacing:-0.02em; transform:translateZ(20px); margin:0; }
        .dc-hero-tilt p{ font-size:15px; color:var(--label2); margin-top:4px; max-width:34ch; line-height:1.4; transform:translateZ(15px); }
        .dc-segmented{ position:relative; display:flex; margin-top:22px; background:var(--bg3); border-radius:10px; padding:2px; transform:translateZ(25px); max-width:280px; }
        .dc-thumb{ position:absolute; top:2px; bottom:2px; left:2px; width:calc(50% - 2px); background:var(--bg4); border-radius:8px;
          box-shadow:0 1px 4px rgba(0,0,0,0.4); transition:transform 0.35s var(--spring); }
        .dc-segmented button{ position:relative; z-index:1; flex:1; padding:8px 0; border:none; background:none; cursor:pointer;
          font-size:13.5px; font-weight:500; color:var(--label2); transition:color 0.25s ease; font-family:var(--font); }
        .dc-segmented button.active{ color:var(--label); font-weight:600; }
        .dc-panel{ background:var(--bg2); border:1px solid var(--sep); border-radius:var(--radius); padding:30px 34px; margin-top:20px;
          position:relative; opacity:0; transform:translateY(16px); transition:opacity 0.5s var(--spring), transform 0.5s var(--spring); }
        .dc-panel.mounted{ opacity:1; transform:translateY(0); }
        .dc-panel::before{ content:''; position:absolute; top:0; left:14px; right:14px; height:1px;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent); }
        .dc-entity-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; }
        .dc-entity-name{ font-size:20px; font-weight:700; letter-spacing:-0.015em; }
        .dc-entity-tagline{ font-size:14px; color:var(--label2); margin-top:3px; }
        .dc-status{ display:flex; align-items:center; gap:6px; font-size:13px; font-weight:500; white-space:nowrap; flex-shrink:0; padding-top:2px; }
        .dc-status::before{ content:''; width:7px; height:7px; border-radius:50%; }
        .status-running{ color:var(--green); } .status-running::before{ background:var(--green); box-shadow:0 0 6px var(--green); }
        .status-open{ color:var(--orange); } .status-open::before{ background:var(--orange); box-shadow:0 0 6px var(--orange); }
        .status-closed{ color:var(--label3); } .status-closed::before{ background:var(--label3); }
        .dc-desc{ font-size:14.5px; color:var(--label2); line-height:1.55; margin-top:14px; max-width:62ch; }
        .dc-chip-row{ display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
        .dc-chip{ font-size:12.5px; font-weight:500; padding:6px 12px; border-radius:20px; color:var(--accent); background:var(--accent-tint); }
        .dc-section-label{ font-size:12.5px; color:var(--label3); margin:26px 0 8px; font-weight:500; }
        .dc-member-row{ display:flex; align-items:center; gap:13px; padding:13px 12px; margin:0 -12px; border-bottom:1px solid var(--sep);
          border-radius:10px; transition:background 0.2s ease, opacity 0.25s ease; }
        .dc-member-row:hover{ background:rgba(255,255,255,0.035); }
        .dc-member-row:last-child{ border-bottom:none; }
        .dc-member-row.removing{ opacity:0; }
        .dc-avatar{ width:40px; height:40px; border-radius:50%; flex-shrink:0; background:linear-gradient(155deg, var(--accent), var(--accent2));
          display:flex; align-items:center; justify-content:center; font-weight:600; font-size:13.5px; color:#0a0a0a; }
        .dc-member-info{ flex:1; min-width:0; }
        .dc-member-info b{ font-size:14.5px; font-weight:600; display:block; line-height:1.3; }
        .dc-member-info span{ font-size:13px; color:var(--label3); line-height:1.3; }
        .dc-member-actions{ display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .dc-request-note{ font-size:13px; color:var(--label3); margin-top:2px; display:block; line-height:1.4; }
        .dc-role{ font-size:12.5px; font-weight:500; }
        .dc-role.admin{ color:var(--accent); }
        .dc-role.member{ color:var(--label3); }
        .dc-btn{ font-size:14px; font-weight:600; padding:9px 18px; border-radius:20px; cursor:pointer; border:none; position:relative;
          font-family:var(--font); transition:transform 0.15s var(--spring), filter 0.2s ease, background 0.2s ease; }
        .dc-btn-primary{ background:var(--accent); color:#0a0a0a; }
        .dc-btn-primary::after{ content:''; position:absolute; inset:0 0 50% 0; border-radius:20px 20px 0 0; background:linear-gradient(rgba(255,255,255,0.18), transparent); pointer-events:none; }
        .dc-btn-primary:hover{ filter:brightness(1.1); }
        .dc-btn-primary:active{ transform:scale(0.96); }
        .dc-btn-primary:disabled{ opacity:0.35; cursor:not-allowed; filter:none; }
        .dc-btn-ghost{ background:var(--bg3); color:var(--label); }
        .dc-btn-ghost:hover{ background:var(--bg4); }
        .dc-btn-ghost:active{ transform:scale(0.96); }
        .dc-btn-ghost:disabled{ opacity:0.5; cursor:not-allowed; }
        .dc-pill{ font-size:12.5px; font-weight:600; padding:7px 14px; border-radius:20px; display:inline-flex; align-items:center; gap:5px;
          border:none; cursor:pointer; font-family:var(--font); transition:background 0.2s ease, transform 0.15s var(--spring); }
        .dc-pill-red{ background:var(--red-tint); color:var(--red); }
        .dc-pill-red:hover{ background:rgba(255,69,58,0.26); }
        .dc-pill-red.confirming{ background:var(--red); color:#fff; }
        .dc-pill-green{ background:var(--green-tint); color:var(--green); }
        .dc-pill-green:hover{ background:rgba(255,152,162,0.26); }
        .dc-pill:active{ transform:scale(0.94); }
        .dc-btn.loading{ color:transparent !important; pointer-events:none; }
        .dc-btn.loading::before{ content:''; position:absolute; top:50%; left:50%; width:15px; height:15px; margin:-7.5px 0 0 -7.5px;
          border:2px solid rgba(10,10,10,0.3); border-top-color:#0a0a0a; border-radius:50%; animation:dc-spin 0.6s linear infinite; }
        @keyframes dc-spin{ to{ transform:rotate(360deg); } }
        .dc-empty{ display:flex; align-items:center; gap:10px; padding:14px 0; color:var(--label3); font-size:13.5px; }
        .dc-field{ margin-bottom:14px; }
        .dc-field label{ display:block; font-size:12.5px; color:var(--label3); margin-bottom:6px; }
        .dc-field input, .dc-field textarea, .dc-field select{ width:100%; padding:10px 13px; background:var(--bg3); border:none; border-radius:9px;
          color:var(--label); font-size:14.5px; font-family:var(--font); outline:none; transition:box-shadow 0.2s ease; }
        .dc-field input:focus, .dc-field textarea:focus, .dc-field select:focus{ box-shadow:0 0 0 2px var(--accent); }
        .dc-field textarea{ resize:vertical; min-height:66px; }
        .dc-form-actions{ display:flex; gap:10px; margin-top:4px; align-items:center; }
        .dc-save-msg{ font-size:13px; color:var(--green); font-weight:500; opacity:0; transition:opacity 0.3s ease; display:flex; align-items:center; gap:5px; }
        .dc-save-msg.show{ opacity:1; }
        .dc-join-card{ margin-top:20px; padding-top:20px; border-top:1px solid var(--sep); }
        .dc-join-sent{ display:flex; align-items:center; gap:8px; font-size:14px; color:var(--green); font-weight:500; }
      `}</style>

      <div className="dc-ambient" />

      <nav className="dc-nav">
        <div className="dc-brand">Dev<span>Connect</span></div>
        <button className="dc-menu-btn" onClick={() => setNavOpen((o) => !o)} aria-label="Toggle menu">
          <Menu size={17} />
        </button>
        <ul className={"dc-links" + (navOpen ? " open" : "")}>
          <li><a>Explore</a></li>
          <li><a className="active">Teams</a></li>
          <li><a>Requests</a></li>
          <li><a>Create</a></li>
          <li><a>Settings</a></li>
        </ul>
      </nav>

      <div className="dc-wrap">
        <div className={"dc-hero-stage" + (mounted ? " mounted" : "")}>
          <div
            className="dc-hero-tilt"
            ref={heroRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
          >
            <div className="dc-sheen" style={{ background: `radial-gradient(480px circle at ${tilt.mx} ${tilt.my}, rgba(255,255,255,0.16), transparent 45%)` }} />
            <div className="dc-hero-mark"><Users size={22} /></div>
            <h1>Your workspace</h1>
            <p>Whatever you've got running right now, live here.</p>
            <div className="dc-segmented">
              <div className="dc-thumb" style={{ transform: activeTab === "team" ? "translateX(0)" : "translateX(100%)" }} />
              <button className={activeTab === "team" ? "active" : ""} onClick={() => setActiveTab("team")}>Team</button>
              <button className={activeTab === "project" ? "active" : ""} onClick={() => setActiveTab("project")}>Project</button>
            </div>
          </div>
        </div>

        {activeTab === "team" && (
          <div className={"dc-panel" + (mounted ? " mounted" : "")}>
            {!editing ? (
              <>
                <div className="dc-entity-top">
                  <div>
                    <div className="dc-entity-name">{team.name}</div>
                    <div className="dc-entity-tagline">{team.tagline}</div>
                  </div>
                  <span className={"dc-status " + statusClass}>{STATUS_COPY[team.status]}</span>
                </div>
                <p className="dc-desc">{team.desc}</p>
                <div className="dc-chip-row">
                  {["React", "Node.js", "PostgreSQL", "Socket.io"].map((t) => <span key={t} className="dc-chip">{t}</span>)}
                </div>
                <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                  <button className="dc-btn dc-btn-ghost" onClick={openEdit}>Edit team</button>
                  <button className="dc-btn dc-btn-primary" onClick={() => window.location.href = '/rooms'} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MessageCircle size={15} /> Open group chat
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="dc-field">
                  <label>Team name</label>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="dc-field">
                  <label>Tagline</label>
                  <input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
                </div>
                <div className="dc-field">
                  <label>Description</label>
                  <textarea value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} />
                </div>
                <div className="dc-field">
                  <label>Status</label>
                  <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                    <option value="running">Running</option>
                    <option value="open">Open to join</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="dc-form-actions">
                  <button className={"dc-btn dc-btn-primary" + (saving ? " loading" : "")} disabled={saving} onClick={handleSave}>Save changes</button>
                  <button className="dc-btn dc-btn-ghost" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
                  <span className={"dc-save-msg" + (savedFlash ? " show" : "")}><Check size={14} />Saved</span>
                </div>
              </div>
            )}

            <div className="dc-section-label">Members</div>
            <div>
              {members.map((m) => (
                <div key={m.id} className={"dc-member-row" + (removingIds.has(m.id) ? " removing" : "")}>
                  <div className="dc-avatar">{m.initials}</div>
                  <div className="dc-member-info"><b>{m.name}</b><span>{m.subtitle}</span></div>
                  {m.role === "admin" ? (
                    <span className="dc-role admin">Admin</span>
                  ) : (
                    <div className="dc-member-actions">
                      <span className="dc-role member">Member</span>
                      <button
                        className={"dc-pill dc-pill-red" + (confirmingId === m.id ? " confirming" : "")}
                        onClick={() => requestRemove(m.id)}
                      >
                        <X size={12} />{confirmingId === m.id ? "Confirm" : "Remove"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="dc-section-label">Pending requests</div>
            <div>
              {requests.map((r) => (
                <div key={r.id} className="dc-member-row">
                  <div className="dc-avatar">{r.initials}</div>
                  <div className="dc-member-info"><b>{r.name}</b><span className="dc-request-note">{r.note}</span></div>
                  <div className="dc-member-actions">
                    <button className="dc-pill dc-pill-green" onClick={() => acceptRequest(r)}><Check size={12} />Accept</button>
                    <button className="dc-pill dc-pill-red" onClick={() => declineRequest(r.id)}><X size={12} />Decline</button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="dc-empty"><Check size={18} />All caught up — no pending requests</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "project" && (
          <div className={"dc-panel" + (mounted ? " mounted" : "")}>
            <div className="dc-entity-top">
              <div>
                <div className="dc-entity-name">Campus Carpool</div>
                <div className="dc-entity-tagline">Ride-sharing app for college commutes</div>
              </div>
              <span className="dc-status status-open">Open to join</span>
            </div>
            <p className="dc-desc">Looking for one more frontend dev to help ship the map view before the semester ends. Backend and auth are already in place.</p>
            <div className="dc-chip-row">
              {["React Native", "Firebase", "Google Maps API"].map((t) => <span key={t} className="dc-chip">{t}</span>)}
            </div>

            <div className="dc-section-label">Members</div>
            <div>
              <div className="dc-member-row">
                <div className="dc-avatar">KB</div>
                <div className="dc-member-info"><b>Karan Bhatt</b><span>Project lead</span></div>
                <span className="dc-role admin">Admin</span>
              </div>
              <div className="dc-member-row">
                <div className="dc-avatar">MS</div>
                <div className="dc-member-info"><b>Meera Shah</b><span>Backend</span></div>
                <span className="dc-role member">Member</span>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="dc-btn dc-btn-ghost" disabled style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} /> Chat — join to unlock
              </button>
            </div>

            <div className="dc-join-card">
              {!joinSent ? (
                <div>
                  <div className="dc-field">
                    <label>Message to the team (optional)</label>
                    <textarea value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} placeholder="Say a bit about why you'd like to join..." />
                  </div>
                  <button className={"dc-btn dc-btn-primary" + (joinSending ? " loading" : "")} disabled={joinSending} onClick={handleJoin}>
                    Request to join
                  </button>
                </div>
              ) : (
                <div className="dc-join-sent"><Check size={16} />Request sent — Karan will get back to you</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { userApi } from "../lib/api.js";
import { Check, Sparkles, ArrowRight, ArrowLeft, Code2, GraduationCap, User as UserIcon, AlertCircle } from "lucide-react";
import "../ProfileApp.css";

const POPULAR_SKILLS = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "MongoDB",
  "Next.js",
  "Tailwind CSS",
  "PostgreSQL",
  "Docker",
  "Socket.io",
  "Express",
  "FastAPI",
  "C++",
  "Figma",
];

const EXPERIENCE_LEVELS = ["Fresher", "1-2 years", "2-5 years", "5+ years"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // If user profile is already complete, redirect to explore immediately
  useEffect(() => {
    if (user?.isProfileComplete) {
      navigate("/explore", { replace: true });
    }
  }, [user, navigate]);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(user?.skills || []);
  const [customSkill, setCustomSkill] = useState("");
  const [experience, setExperience] = useState(user?.experience || "Fresher");
  const [gender, setGender] = useState(user?.gender || "other");

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const clean = customSkill.trim();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
      setCustomSkill("");
    }
  };

  // Step Validations
  const isStep1Valid = name.trim().length >= 2 && college.trim().length >= 2;
  const isStep2Valid = bio.trim().length >= 10;
  const isStep3Valid = skills.length >= 1;

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMsg("Please enter your full name (at least 2 characters).");
        return;
      }
      if (!college.trim() || college.trim().length < 2) {
        setErrorMsg("Please enter your university, college, or school name.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!bio.trim() || bio.trim().length < 10) {
        setErrorMsg("Please provide a bio of at least 10 characters describing your interests.");
        return;
      }
      setStep(3);
    }
  };

  const handleFinish = async () => {
    setErrorMsg("");
    if (skills.length === 0) {
      setErrorMsg("Please select or add at least 1 skill to complete your profile.");
      return;
    }

    setSaving(true);
    try {
      const res = await userApi.updateProfile({
        name: name.trim(),
        college: college.trim(),
        bio: bio.trim(),
        skills,
        experience,
        gender,
      });

      const updatedUser = res?.data || res?.user || res;
      if (updateUser) {
        updateUser({
          ...updatedUser,
          isProfileComplete: true,
        });
      }

      // Smooth transition to explore
      setTimeout(() => {
        navigate("/explore", { replace: true });
      }, 500);
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to save profile. Please check your network and try again."
      );
      setSaving(false);
    }
  };

  return (
    <div className="profile-app-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="grain" />

      <main className="app-main" style={{ width: "100%", maxWidth: "780px", margin: "0 auto", padding: "60px 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display, 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif)",
              fontSize: "32px",
              fontWeight: 700,
              color: "var(--text, #f5f5f7)",
              margin: "0 0 10px 0",
              letterSpacing: "-0.025em",
            }}
          >
            Welcome to DevConnect
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif)",
              color: "var(--text-muted, #86868b)",
              fontSize: "15px",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.5,
            }}
          >
            Complete your builder profile to find hackathon teammates and collaborate on real projects.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "36px",
          }}
        >
          {[
            { num: 1, label: "Identity" },
            { num: 2, label: "About You" },
            { num: 3, label: "Stack & Skills" },
          ].map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: isCurrent
                      ? "var(--coral, #ff98a2)"
                      : isCompleted
                      ? "rgba(255, 152, 162, 0.25)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: isCurrent ? "#0c0d10" : isCompleted ? "var(--coral, #ff98a2)" : "var(--text-muted)",
                    border: isCurrent
                      ? "1px solid var(--coral)"
                      : isCompleted
                      ? "1px solid rgba(255, 152, 162, 0.4)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isCompleted ? <Check size={14} /> : s.num}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? "var(--text, #f5f5f7)" : "var(--text-muted, #86868b)",
                  }}
                >
                  {s.label}
                </span>
                {idx < 2 && (
                  <div
                    style={{
                      width: "36px",
                      height: "1px",
                      background: isCompleted ? "rgba(255, 152, 162, 0.4)" : "rgba(255, 255, 255, 0.1)",
                      margin: "0 6px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: "rgba(255, 69, 58, 0.12)",
              border: "1px solid rgba(255, 69, 58, 0.3)",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#ff453a",
              fontSize: "13px",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Card Box */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  <UserIcon size={14} color="var(--coral)" />
                  <span>Full Name</span>
                  <span style={{ color: "var(--coral)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  <GraduationCap size={14} color="var(--coral)" />
                  <span>College / University / Organization</span>
                  <span style={{ color: "var(--coral)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Stanford University or Independent Builder"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  Gender (Optional, for SIH & hackathon diversity filters)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#181920",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: BIO */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  Tell others what you build (Bio) <span style={{ color: "var(--coral)" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a brief intro about what technologies you enjoy building with, past hackathon experience, or what kind of teams you are looking to join..."
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    lineHeight: "1.5",
                    resize: "vertical",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                    fontSize: "12px",
                    color: bio.trim().length >= 10 ? "var(--coral, #ff98a2)" : "var(--text-muted)",
                  }}
                >
                  <span>{bio.trim().length < 10 ? `Minimum 10 characters (${10 - bio.trim().length} more needed)` : "Length satisfied"}</span>
                  <span>{bio.length}/200</span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  Experience Level
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperience(lvl)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: experience === lvl ? "rgba(255, 152, 162, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        border: experience === lvl ? "1px solid var(--coral)" : "1px solid rgba(255, 255, 255, 0.1)",
                        color: experience === lvl ? "var(--coral)" : "var(--text-muted)",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS & FINISH */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  <Code2 size={14} color="var(--coral)" />
                  <span>Choose Your Core Skills</span>
                  <span style={{ color: "var(--coral)" }}>* (at least 1 required)</span>
                </label>

                {/* Popular Tags Strip */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                  {POPULAR_SKILLS.map((sk) => {
                    const isSelected = skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: "pointer",
                          background: isSelected ? "var(--coral, #ff98a2)" : "rgba(255, 255, 255, 0.05)",
                          color: isSelected ? "#0c0d10" : "var(--text, #f5f5f7)",
                          border: isSelected ? "1px solid var(--coral)" : "1px solid rgba(255, 255, 255, 0.1)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{sk}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Skill */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCustomSkill(e);
                    }}
                    placeholder="Add custom skill (e.g. Solidity, GraphQL)..."
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#fff",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Selected Skills Chips */}
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                  Your selected skills ({skills.length}):
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skills.length === 0 ? (
                    <span style={{ fontSize: "13px", color: "#ff453a" }}>None selected yet. Please click tags above or add one.</span>
                  ) : (
                    skills.map((s) => (
                      <span
                        key={s}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: "rgba(255, 152, 162, 0.15)",
                          border: "1px solid rgba(255, 152, 162, 0.3)",
                          color: "var(--coral, #ff98a2)",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => toggleSkill(s)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--coral)",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "14px",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "8px 12px",
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  background: "var(--coral, #ff98a2)",
                  color: "#0c0d10",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: (step === 1 ? isStep1Valid : isStep2Valid) ? "pointer" : "not-allowed",
                  opacity: (step === 1 ? isStep1Valid : isStep2Valid) ? 1 : 0.5,
                  transition: "all 0.2s ease",
                }}
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving || !isStep3Valid}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  background: "var(--coral, #ff98a2)",
                  color: "#0c0d10",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  cursor: !saving && isStep3Valid ? "pointer" : "not-allowed",
                  opacity: !saving && isStep3Valid ? 1 : 0.5,
                  boxShadow: "0 0 20px rgba(255, 152, 162, 0.4)",
                  transition: "all 0.2s ease",
                }}
              >
                {saving ? (
                  <span>Completing Setup...</span>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Complete & Enter DevConnect</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

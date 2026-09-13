export function overlap(a = [], b = []) {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => setB.has(s.toLowerCase()));
}

export function scorePair(skillsA, skillsB) {
  const shared = overlap(skillsA, skillsB);
  const union = new Set([...skillsA, ...skillsB].map((s) => s.toLowerCase()));
  const base = union.size ? (shared.length / union.size) * 100 : 0;
  // A little complementary-skill bonus — some non-overlapping skill is good,
  // full overlap (everyone does the same thing) is actually a weaker signal.
  const complementBonus = Math.min(15, (skillsA.length + skillsB.length - shared.length * 2) * 2);
  return Math.max(35, Math.min(97, Math.round(base * 0.75 + complementBonus + 25)));
}

export function scoreCandidateVsTeam(candidateSkills, teamSkills) {
  const missing = teamSkills.filter((s) => !candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase()));
  const covers = teamSkills.length ? (teamSkills.length - missing.length) / teamSkills.length : 0;
  const extra = candidateSkills.filter((s) => !teamSkills.some((ts) => ts.toLowerCase() === s.toLowerCase()));
  const score = Math.round(covers * 55 + Math.min(30, extra.length * 8) + 20);
  return { score: Math.max(30, Math.min(96, score)), missing, extra };
}
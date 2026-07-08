const normalizeSkills = (skills=>[]) =
    skills.map((s)=> s.toLowerCase().trim()).filter(Boolean);

const calculateSkillScore = (skillsA = [], skillsB = [])=>{
    const a = new Set(normalizeSkills(skillsA));
    const b = new Set(normalizeSkills(skillsB));

    if(a.size === 0 || b.size === 0) return 0;

    const intersection = [...a].filter((skill)=> b.has(skill));
    const union = new Set([...a, ...b]);
    const overLapRatio = intesection.length / union.size;

    return Math.round(overLapRatio * 50);

}
const calculateReputationScore =(reputationScore = 0)=>{
    const capped = Math.min(reputationScore, 1000);
    return Math.round((capped / 1000) * 25);
};

const calculatePastProjectScore = ({
    completedProjectsCount = 0,
    sharedPastCollaboratores = 0,
    techStackOverlapWithPastProjects = 0,
    })=>{
        const experiencePoints = Math.min(completedProjectsCount * 3,12);
        const collaboratorPoints = Math.min(sharedPastCollaboratores * 4, 8);
        const stackFamiliarity = Math.min(techStackOverlapWithPastProjects * 1, 5);
        return Math.round(experiencePoints + collaboratorPoints + stackFamiliarity);
};
export const computeMatchScore = (candidate, target) =>{
    const SkillScore = calculateSkillScore(candidate.skills, target.skills);
    const ReputationScore = calculateReputationScore(candidate.reputationScore);
    const PastProjectScore = calculatePastProjectScore({
        completedProjectsCount: candidate.completedProjectsCount,
        sharedPastCollaboratores: candidate.sharedPastCollaboratores,
        techStackOverlapWithPastProjects: candidate.techStackOverlapWithPastProjects,
    });
    const totalScore = SkillScore + ReputationScore + PastProjectScore;

    return {
        totalScore: Math.min(totalScore, 100),
        breakdown:{skillscore,reputationScore,pastProjectScore},

    };

};
export const rankMatches = (candidates = [], target, limit = 10) => {
  const scored = candidates.map((candidate) => {
    const { totalScore, breakdown } = computeMatchScore(candidate, target);
    return { ...candidate, matchScore: totalScore, matchBreakdown: breakdown };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
};

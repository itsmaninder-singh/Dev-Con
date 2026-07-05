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
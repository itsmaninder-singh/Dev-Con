import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { callLLMForJSON } from "../utils/llm.js";
import { Team } from "../model/team.model.js";
import { Project } from "../model/project.model.js";
import { User } from "../model/user.model.js";
import mongoose from "mongoose";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildMatchProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "name skills experienceLevel timezone availability preferredRole personality",
  );
  if (!user) return null;

  const previousProjectsCount = await Project.countDocuments({
    "members.user": userId,
    status: "completed",
  });

  return {
    userId: user._id.toString(),
    name: user.name,
    skills: user.skills || [],
    experienceLevel: user.experienceLevel,
    timezone: user.timezone || "not specified",
    availability: user.availability || "not specified",
    preferredRole: user.preferredRole || "not specified",
    personality: user.personality,
    previousProjectsCompleted: previousProjectsCount,
  };
};

const IDEA_GENERATOR_SYSTEM_PROMPT = `You are a startup/hackathon idea consultant. Given a
domain, you generate a broad list of project ideas, then pick the 5 most feasible ones
for a small team to build in a hackathon or short project timeframe, with full technical
and business detail for each.

Respond with this exact JSON shape:
{
  "domain": string,
  "allIdeas": [string, ...],  // 100 short one-line idea titles
  "topFeasible": [
    {
      "title": string,
      "description": string,
      "techStack": [string, ...],
      "architecture": string,       // short paragraph describing system architecture
      "database": string,           // what kind of DB and why, key entities
      "apis": [string, ...],        // external APIs/services needed
      "timeline": string,           // rough build timeline breakdown
      "monetization": string,       // how this could make money, if applicable
      "pitch": string               // a punchy 2-3 sentence elevator pitch
    }
  ]  // exactly 5 of these, picked from allIdeas
}`;

const generateIdeas = asyncHandler(async (req, res) => {
  const { domain } = req.body;

  if (!domain || !domain.trim()) {
    throw new ApiError(
      400,
      "domain is required (e.g. 'Healthcare', 'Education', 'Fintech')",
    );
  }
  if (domain.length > 100) {
    throw new ApiError(400, "domain is too long");
  }

  let result;
  try {
    result = await callLLMForJSON(
      IDEA_GENERATOR_SYSTEM_PROMPT,
      `Generate ideas for the domain: "${domain.trim()}"`,
      "strong",
    );
  } catch (err) {
    throw new ApiError(502, `AI idea generation failed: ${err.message}`);
  }

  return res.status(200).json(new ApiResponse(200, "Ideas generated", result));
});

const VALID_ROLES = [
  "Frontend",
  "Backend",
  "AI",
  "Cloud",
  "UI/UX",
  "Presentation",
  "Testing",
  "Documentation",
];

const ROLE_ASSIGNMENT_SYSTEM_PROMPT = `You assign each team member ONE role from this
fixed list based on their skills: ${VALID_ROLES.join(", ")}. Try to cover as many
different roles as possible across the team rather than clustering everyone into one
role, unless the skills genuinely don't support that spread. Every member must get
exactly one role from the list - never invent a new role name.

Respond with this exact JSON shape:
{
  "assignments": [
    { "userId": string, "name": string, "role": string, "reason": string }
  ]
}`;

const assignRoles = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;

  if (!["team", "project"].includes(targetType)) {
    throw new ApiError(400, 'targetType must be "team" or "project"');
  }

  const Model = targetType === "team" ? Team : Project;
  const entity = await Model.findById(targetId).populate(
    "members.user",
    "name skills experienceLevel",
  );

  if (!entity) throw new ApiError(404, `${targetType} not found`);

  const isMember = entity.members.some(
    (m) => m.user._id.toString() === req.user._id.toString(),
  );
  if (!isMember)
    throw new ApiError(
      403,
      `Only members of this ${targetType} can request role assignment`,
    );

  if (entity.members.length === 0) {
    throw new ApiError(400, "This team/project has no members yet");
  }

  const memberSummaries = entity.members.map((m) => ({
    userId: m.user._id.toString(),
    name: m.user.name,
    skills: m.user.skills || [],
    experienceLevel: m.user.experienceLevel,
  }));

  let result;
  try {
    result = await callLLMForJSON(
      ROLE_ASSIGNMENT_SYSTEM_PROMPT,
      `Team members:\n${JSON.stringify(memberSummaries, null, 2)}`,
      "fast",
    );
  } catch (err) {
    throw new ApiError(502, `AI role assignment failed: ${err.message}`);
  }

  const sanitized = {
    assignments: (result.assignments || []).map((a) => ({
      ...a,
      role: VALID_ROLES.includes(a.role) ? a.role : "Backend", // safe fallback, never silently drop a member
    })),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, "Roles assigned", sanitized));
});

export { generateIdeas, assignRoles };

const COMPATIBILITY_SYSTEM_PROMPT = `You analyze how compatible two potential
teammates are for working together, based on their profile data (skills,
experience, timezone, availability, preferred role, personality). Give a
realistic score, not always a high one - genuinely weigh mismatches (different
timezones, clashing work styles, both wanting the same role, no complementary
skills) against strengths.

Respond with this exact JSON shape:
{
  "compatibilityScore": number,  // 0-100
  "reasons": [string, ...]       // 3-6 short bullet-style reasons, each starting with a checkmark-style phrase like "Same timezone" or "Complementary skills" - be specific to what you actually observed, not generic filler
}`;

const analyzeCompatibility = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  if (!isValidId(targetUserId))
    throw new ApiError(400, "Valid targetUserId is required");
  if (targetUserId === req.user._id.toString()) {
    throw new ApiError(400, "Can't analyze compatibility with yourself");
  }

  const [me, target] = await Promise.all([
    buildMatchProfile(req.user._id),
    buildMatchProfile(targetUserId),
  ]);
  if (!target) throw new ApiError(404, "Target user not found");

  let result;
  try {
    result = await callLLMForJSON(
      COMPATIBILITY_SYSTEM_PROMPT,
      `Person A:\n${JSON.stringify(me, null, 2)}\n\nPerson B:\n${JSON.stringify(target, null, 2)}`,
      "strong",
    );
  } catch (err) {
    throw new ApiError(502, `AI compatibility analysis failed: ${err.message}`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Compatibility analyzed", result));
});

const TEAM_FIT_SYSTEM_PROMPT = `You analyze how well a candidate would fit into an
existing team, given the team's current members' skills and the candidate's own
profile. Consider skill complementarity (does the candidate fill a gap the team
is missing, or just duplicate what's already covered) and team balance overall.

Respond with this exact JSON shape:
{
  "teamBalanceScore": number,      // 0-100 - how much better balanced the team becomes with this candidate added
  "missingSkills": [string, ...],  // skills the team currently lacks (before adding the candidate)
  "suggestedRole": string,         // one role from: Frontend, Backend, AI, Cloud, UI/UX, Presentation, Testing, Documentation
  "reasons": [string, ...]
}`;

const analyzeTeamFit = asyncHandler(async (req, res) => {
  const { teamId, candidateUserId } = req.body;
  if (!isValidId(teamId) || !isValidId(candidateUserId)) {
    throw new ApiError(400, "Valid teamId and candidateUserId are required");
  }

  const team = await Team.findById(teamId).populate(
    "members.user",
    "name skills experienceLevel",
  );
  if (!team) throw new ApiError(404, "Team not found");

  const isMember = team.members.some(
    (m) => m.user._id.toString() === req.user._id.toString(),
  );
  if (!isMember)
    throw new ApiError(
      403,
      "Only team members can request a team-fit analysis",
    );

  const candidate = await buildMatchProfile(candidateUserId);
  if (!candidate) throw new ApiError(404, "Candidate user not found");

  const teamSummary = team.members.map((m) => ({
    name: m.user.name,
    skills: m.user.skills || [],
    experienceLevel: m.user.experienceLevel,
  }));

  let result;
  try {
    result = await callLLMForJSON(
      TEAM_FIT_SYSTEM_PROMPT,
      `Current team members:\n${JSON.stringify(teamSummary, null, 2)}\n\nCandidate:\n${JSON.stringify(candidate, null, 2)}`,
      "strong",
    );
  } catch (err) {
    throw new ApiError(502, `AI team-fit analysis failed: ${err.message}`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Team fit analyzed", result));
});

export { analyzeCompatibility, analyzeTeamFit };

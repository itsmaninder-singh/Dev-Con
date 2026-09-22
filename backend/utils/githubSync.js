import { User } from "../models/user.model.js";

const GITHUB_REST_API = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const MAX_TOP_REPOS = 6;

const hasToken = () => Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim());

const restHeaders = () => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "DevConnect-App",
  ...(hasToken() ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN.trim()}` } : {}),
});

const githubFetch = async (path) => {
  const res = await fetch(`${GITHUB_REST_API}${path}`, { headers: restHeaders() });
  if (res.status === 404) {
    const err = new Error("GitHub user or resource not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (res.status === 403) {
    const err = new Error("GitHub API rate limit exceeded");
    err.code = "RATE_LIMITED";
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`GitHub API error: ${res.status}`);
    err.code = "API_ERROR";
    throw err;
  }
  return res.json();
};

/**
 * Scrapes public contributions from GitHub profile HTML calendar.
 * Safe fallback when GITHUB_TOKEN is not configured or GraphQL fails.
 */
const scrapePublicContributions = async (githubUsername) => {
  try {
    const res = await fetch(`https://github.com/users/${githubUsername}/contributions`, {
      headers: { "User-Agent": "DevConnect-App" },
    });
    if (!res.ok) return { current: 0, longest: 0 };
    const html = await res.text();
    const dayRegex = /<td[^>]*data-date="([^"]+)"[^>]*data-level="([^"]+)"/g;
    let match;
    const days = [];
    while ((match = dayRegex.exec(html)) !== null) {
      days.push({ date: match[1], level: parseInt(match[2], 10) });
    }
    if (days.length === 0) return { current: 0, longest: 0 };

    days.sort((a, b) => (a.date > b.date ? 1 : -1));

    let longest = 0;
    let running = 0;
    for (const day of days) {
      if (day.level > 0) {
        running++;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }
    }

    let current = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].level > 0) {
        current++;
      } else if (i === days.length - 1) {
        // Today has 0 contributions so far; keep streak alive based on yesterday
        continue;
      } else {
        break;
      }
    }

    return { current, longest };
  } catch (err) {
    console.warn(`[githubSync] Public contribution scraping failed for ${githubUsername}:`, err.message);
    return { current: 0, longest: 0 };
  }
};

/**
 * Fetches contribution streaks using GitHub GraphQL API (if token present),
 * or falls back to scraping public contributions so it never crashes.
 */
const fetchContributionStreak = async (githubUsername) => {
  if (hasToken()) {
    try {
      const query = `
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `;

      const res = await fetch(GITHUB_GRAPHQL_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN.trim()}`,
          "Content-Type": "application/json",
          "User-Agent": "DevConnect-App",
        },
        body: JSON.stringify({
          query,
          variables: { login: githubUsername },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.user?.contributionsCollection?.contributionCalendar?.weeks) {
          const days = json.data.user.contributionsCollection.contributionCalendar.weeks
            .flatMap((week) => week.contributionDays)
            .map((day) => ({ date: day.date, count: day.contributionCount }));

          days.sort((a, b) => (a.date > b.date ? 1 : -1));

          let longest = 0;
          let running = 0;
          for (const day of days) {
            if (day.count > 0) {
              running++;
              longest = Math.max(longest, running);
            } else {
              running = 0;
            }
          }

          let current = 0;
          for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].count > 0) {
              current++;
            } else if (i === days.length - 1) {
              continue;
            } else {
              break;
            }
          }

          return { current, longest };
        }
      }
    } catch (gqlErr) {
      console.warn(`[githubSync] GraphQL streak fetch failed for ${githubUsername}:`, gqlErr.message);
    }
  }

  // Safe fallback to public scraper
  return scrapePublicContributions(githubUsername);
};

export const computeGithubBadges = ({ streak, publicRepoCount } = {}) => {
  const streakDays = Number(streak?.longest || streak?.current || 0);
  const streakBadge = streakDays >= 30 ? 3 : streakDays >= 7 ? 2 : streakDays >= 1 ? 1 : 0;

  const repoCount = Number(publicRepoCount || 0);
  const projectBadge = repoCount >= 20 ? 3 : repoCount >= 10 ? 2 : repoCount >= 3 ? 1 : 0;

  return {
    streak: streakBadge,
    projectCount: projectBadge,
  };
};

export const computeDevconnectActivityBadge = async (userId) => {
  try {
    const user = await User.findById(userId).select("reputation connections");
    if (!user) return 0;
    const repScore = Number(user.reputation?.score || 0);
    const connCount = Array.isArray(user.connections) ? user.connections.length : 0;
    if (repScore >= 100 || connCount >= 15) return 3;
    if (repScore >= 30 || connCount >= 5) return 2;
    if (repScore > 0 || connCount >= 1) return 1;
    return 0;
  } catch {
    return 0;
  }
};

export const syncGithubProfileForUser = async (userId, githubUsername) => {
  try {
    const cleanUsername = String(githubUsername || "")
      .trim()
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/$/, "");

    if (!cleanUsername) {
      const err = new Error("GitHub username is required");
      err.code = "INVALID_INPUT";
      throw err;
    }

    let profile = null;
    let repos = [];
    let streak = { current: 0, longest: 0 };

    try {
      profile = await githubFetch(`/users/${cleanUsername}`);
    } catch (err) {
      if (err.code === "NOT_FOUND") {
        const notFound = new Error(`GitHub user "${cleanUsername}" was not found`);
        notFound.code = "NOT_FOUND";
        throw notFound;
      }
      throw err;
    }

    try {
      repos = await githubFetch(`/users/${cleanUsername}/repos?per_page=100&sort=updated`);
    } catch (repoErr) {
      console.warn(`[githubSync] Failed to fetch repos for ${cleanUsername}:`, repoErr.message);
      repos = [];
    }

    try {
      streak = await fetchContributionStreak(cleanUsername);
    } catch (streakErr) {
      console.warn(`[githubSync] Failed to fetch streak for ${cleanUsername}:`, streakErr.message);
      streak = { current: 0, longest: 0 };
    }

    const topRepos = (Array.isArray(repos) ? repos : [])
      .filter((r) => !r.fork)
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, MAX_TOP_REPOS)
      .map((r) => ({
        name: r.name,
        description: r.description || "",
        url: r.html_url,
        stars: r.stargazers_count || 0,
        language: r.language || "",
      }));

    const githubProfile = {
      publicRepoCount: profile.public_repos || 0,
      topRepos,
      streak,
      lastSyncedAt: new Date(),
    };

    const githubBadges = computeGithubBadges({
      streak,
      publicRepoCount: githubProfile.publicRepoCount,
    });
    const devconnectActivityBadge = await computeDevconnectActivityBadge(userId);

    await User.findByIdAndUpdate(userId, {
      githubUsername: cleanUsername,
      githubProfile,
      "badges.github": githubBadges.streak,
      "badges.devconnectActivity": devconnectActivityBadge,
      "badges.projectCount": githubBadges.projectCount,
    });

    return githubProfile;
  } catch (err) {
    if (err.code === "NOT_FOUND" || err.code === "RATE_LIMITED" || err.code === "INVALID_INPUT") {
      throw err;
    }
    console.warn(`Failed to sync GitHub profile for user ${userId}: ${err.message}`);
    throw err;
  }
};

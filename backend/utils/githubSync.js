import { User } from "../models/user.model.js";

const GITHUB_REST_API = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const MAX_TOP_REPOS = 6;

const hasServerToken = () => {
  const token = process.env.GITHUB_TOKEN?.trim();
  return Boolean(
    token &&
    (token.startsWith("ghp_") || token.startsWith("github_pat_") || token.startsWith("gho_"))
  );
};

const resolveToken = async (userId, explicitToken) => {
  if (explicitToken && typeof explicitToken === "string" && explicitToken.trim()) {
    return explicitToken.trim();
  }
  if (hasServerToken()) {
    return process.env.GITHUB_TOKEN.trim();
  }
  if (userId) {
    try {
      const user = await User.findById(userId).select("+githubAccessToken");
      if (user?.githubAccessToken) {
        return user.githubAccessToken;
      }
    } catch (_) {}
  }
  return null;
};

const githubFetch = async (path, token = null) => {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "DevConnect-App",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res;
  try {
    res = await fetch(`${GITHUB_REST_API}${path}`, { headers });
  } catch (netErr) {
    const err = new Error(`Network error connecting to GitHub: ${netErr.message}`);
    err.code = "NETWORK_ERROR";
    throw err;
  }

  // If 401 Unauthorized with token, retry unauthenticated
  if (res.status === 401 && token) {
    console.warn(`[githubSync] Token 401 on "${path}". Retrying unauthenticated.`);
    try {
      res = await fetch(`${GITHUB_REST_API}${path}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "DevConnect-App",
        },
      });
    } catch (_) {}
  }

  if (res.status === 404) {
    const err = new Error("GitHub user or resource not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (res.status === 403 || res.status === 429) {
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
 * Safe fallback when GITHUB_TOKEN is not configured, rate limited, or GraphQL fails.
 */
export const scrapePublicContributions = async (githubUsername) => {
  try {
    const res = await fetch(`https://github.com/users/${githubUsername}/contributions`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
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
        continue;
      } else {
        break;
      }
    }

    return { current, longest };
  } catch (err) {
    console.warn(`[githubSync] Public contribution scraping notice for ${githubUsername}:`, err.message);
    return { current: 0, longest: 0 };
  }
};

/**
 * Scrapes public repositories from GitHub profile HTML repositories tab.
 * Bulletproof fallback when GitHub REST API rate limit is reached.
 */
export const scrapePublicRepositories = async (githubUsername) => {
  try {
    const res = await fetch(`https://github.com/${githubUsername}?tab=repositories`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return { repos: [], publicRepoCount: 0 };
    const html = await res.text();

    const repoBlockRegex = /<li[^>]*itemprop="owns"[^>]*>([\s\S]*?)<\/li>/g;
    let match;
    const repos = [];
    while ((match = repoBlockRegex.exec(html)) !== null) {
      const block = match[1];
      const nameMatch = /itemprop="name codeRepository"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const hrefMatch = /href="\/([^\/"]+\/[^\/"]+)"/i.exec(block);
      const descMatch = /itemprop="description"[^>]*>([\s\S]*?)<\/p>/i.exec(block);
      const langMatch = /itemprop="programmingLanguage"[^>]*>([\s\S]*?)<\/span>/i.exec(block);
      const starMatch = /href="[^"]*\/stargazers"[^>]*>[\s\S]*?([\d,]+)[\s\S]*?<\/a>/i.exec(block);

      if (nameMatch && hrefMatch) {
        repos.push({
          name: nameMatch[1].trim(),
          description: descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "",
          url: `https://github.com/${hrefMatch[1].trim()}`,
          stars: starMatch ? parseInt(starMatch[1].replace(/,/g, ""), 10) || 0 : 0,
          language: langMatch ? langMatch[1].trim() : "",
        });
      }
    }

    const countMatch =
      /data-tab-item="repositories"[\s\S]*?<span[^>]*class="Counter"[^>]*>([\d,]+)<\/span>/i.exec(html) ||
      /repositories[\s\S]*?<span[^>]*title="([\d,]+)"/i.exec(html) ||
      /class="Counter[^"]*"[^>]*title="([\d,]+)"/i.exec(html);

    const publicRepoCount = countMatch ? parseInt(countMatch[1].replace(/,/g, ""), 10) || repos.length : repos.length;

    return { repos, publicRepoCount };
  } catch (err) {
    console.warn(`[githubSync] Public repo scraping fallback notice for ${githubUsername}:`, err.message);
    return { repos: [], publicRepoCount: 0 };
  }
};

/**
 * Fetches contribution streaks using GitHub GraphQL API (if token present),
 * or falls back to scraping public contributions so it never crashes.
 */
const fetchContributionStreak = async (githubUsername, token) => {
  if (token) {
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
          Authorization: `Bearer ${token}`,
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

/**
 * Synchronizes GitHub profile stats (public repos, contribution streaks, badges)
 * for a user. Resilient against rate limits, invalid tokens, and network hiccups.
 */
export const syncGithubProfileForUser = async (userId, githubUsername, explicitToken = null) => {
  const cleanUsername = String(githubUsername || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/$/, "");

  if (!cleanUsername) {
    const err = new Error("GitHub username is required");
    err.code = "INVALID_INPUT";
    throw err;
  }

  const token = await resolveToken(userId, explicitToken);
  const existingUser = userId ? await User.findById(userId).select("githubProfile badges") : null;

  let profile = null;
  let repos = [];
  let streak = { current: 0, longest: 0 };
  let publicRepoCount = 0;

  // 1. Fetch public profile (REST with fallback to scraped count / existing DB)
  try {
    profile = await githubFetch(`/users/${cleanUsername}`, token);
    publicRepoCount = profile.public_repos || 0;
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      const notFound = new Error(`GitHub user "${cleanUsername}" was not found`);
      notFound.code = "NOT_FOUND";
      throw notFound;
    }
    console.warn(`[githubSync] REST /users/${cleanUsername} notice (${err.code || err.message}). Using scraper/cache.`);
  }

  // 2. Fetch repos (REST with fallback to public HTML scraper or existing DB)
  try {
    const restRepos = await githubFetch(`/users/${cleanUsername}/repos?per_page=100&sort=updated`, token);
    if (Array.isArray(restRepos) && restRepos.length > 0) {
      repos = restRepos
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
    }
  } catch (repoErr) {
    console.warn(`[githubSync] REST repos failed (${repoErr.code || repoErr.message}), falling back to scraper.`);
  }

  // If REST returned no repos, use the public scraper
  if (repos.length === 0) {
    const scraped = await scrapePublicRepositories(cleanUsername);
    if (scraped.repos.length > 0) {
      repos = scraped.repos.slice(0, MAX_TOP_REPOS);
    }
    if (!publicRepoCount && scraped.publicRepoCount) {
      publicRepoCount = scraped.publicRepoCount;
    }
  }

  // If still no repos but existing user already has saved repos, preserve them
  if (repos.length === 0 && existingUser?.githubProfile?.topRepos?.length) {
    repos = existingUser.githubProfile.topRepos;
  }
  if (!publicRepoCount && existingUser?.githubProfile?.publicRepoCount) {
    publicRepoCount = existingUser.githubProfile.publicRepoCount;
  }

  // 3. Fetch contribution streak
  try {
    streak = await fetchContributionStreak(cleanUsername, token);
  } catch (streakErr) {
    console.warn(`[githubSync] Streak fetch notice for ${cleanUsername}:`, streakErr.message);
    streak = existingUser?.githubProfile?.streak || { current: 0, longest: 0 };
  }

  const githubProfile = {
    publicRepoCount,
    topRepos: repos,
    streak,
    lastSyncedAt: new Date(),
  };

  const githubBadges = computeGithubBadges({
    streak,
    publicRepoCount: githubProfile.publicRepoCount,
  });
  const devconnectActivityBadge = await computeDevconnectActivityBadge(userId);

  if (userId) {
    await User.findByIdAndUpdate(userId, {
      githubUsername: cleanUsername,
      githubProfile,
      "badges.github": githubBadges.streak,
      "badges.devconnectActivity": devconnectActivityBadge,
      "badges.projectCount": githubBadges.projectCount,
    });
  }

  return githubProfile;
};

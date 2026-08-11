import {User} from "../models/user.model.js";
const GITHUB_REST_API = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const MAX_TOP_REPOS = 6;

const hasToken = () => Boolean(process.env.GITHUB_TOKEN);
const restHeaders = ()=>({
    Accept: "application/vnd.github+json",
    ...(hasToken()? {Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),

});
const githubFetch = async(path)=>{
    const res = await fetch(`${GITHUB_REST_API}${path}`, { headers: restHeaders() });
    if (res.status === 404) {
    const err = new Error("GitHub user not found");
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

const fetchContributionStreak = async(githubUsername)=>{
  if(!hasToken()) return {current: 0, longest: 0 };
  const query = `
  query($login:String!){
  user(login:$login){
  contributionsCollection{
  contributionCalendar{
  weeks{
  contributionDays{
  date
  contributionCount
  }}}
  `;

  const res = await fetch(GITHUB_GRAPHQL_API,{
    method: "POST",
    headers:{
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,variables: { login: githubUsername },
    }),
  });
  if(!res.ok){
    const err = new Error(`GitHub GraphQL API error: ${res.status}`);
    err.code = "API_ERROR";
    throw err;
  }
  const days = json.data.user.contributionsCollection.contributionCalendar.weeks.flatMap((week)=>week.contributionDays)
  .map((day)=>({ date: day.date,
     count: day.contributionCount }));

  let longest=0;
  let running=0;
  for(const day of days){
    if(day.count>0){
      running++;
      longest = Math.max(longest,running);
    }else{
      running=0;
    }
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      current += 1;
    } else if (i === days.length - 1) {
      continue; 
    } else {
      break;
    }
  }

  return { current, longest };
};

export const syncGithubProfileForUser = async(userId,githubUsername)=>{
  try{
    const[profile,repos,streak]= await Promise.all([
      githubFetch(`/users/${githubUsername}`),
      githubFetch(`/users/${githubUsername}/repos?per_page=100&sort=updated`),
      fetchContributionStreak(githubUsername),
    ]);
    const topRepos = repos
    .filter((r)=>!r.fork)
    .sort((a,b)=>b.stargazers_count-a.stargazers_count)
    .slice(0,MAX_TOP_REPOS)
    .map((r)=>({
      name:r.name,
      description:r.description,
      url:r.html_url,
      stars:r.stargazers_count,
      language:r.language || "",
    }));
    const githubProfile = {
      publicRepoCount: profile.public_repos ||0,
      topRepos,
      streak,
      lastSyncedAt: new Date(),
    };
    const githubBadges = computeGithubBadges({
      streak,
      publicRepoCount: githubProfile.publicRepoCount,

    });
    const devconnectActivityBadge = await computeDevconnectActivityBadge(userId);

    await User.findByIdAndUpdate(userId,{
      githubProfile,
      "badges.github": githubBadges.streak,
      "badges.devconnectActivity": devconnectActivityBadge,
      "badges.projectCount": githubBadges.projectCount,

    });
    return githubProfile;

  }
  catch(err){
    if(err.code==="NOT_FOUND" || err.code==="RATE_LIMITED" || err.code==="API_ERROR"){
      console.warn(`Failed to sync GitHub profile for user ${userId}: ${err.message}`);
      return null;

  }
  throw err;
}
};

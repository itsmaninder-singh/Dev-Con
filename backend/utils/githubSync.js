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
      continue; // today with 0 contributions yet - don't break the streak on this alone
    } else {
      break;
    }
  }

  return { current, longest };
};

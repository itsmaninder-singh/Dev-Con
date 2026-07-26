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

}
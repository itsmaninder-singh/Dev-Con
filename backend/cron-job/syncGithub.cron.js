import cron from "node-cron";
import { User } from "../model/user.model.js";
import { syncGithubProfileForUser } from "../utils/githubSync.js";

const SYNC_INTERVAL = 24*60*60*60*1000;
const DELAY_BETWEEN_SYNCS_MS = 1500;

const sleep =(ms)=> new Promise((reso)=> setTimeout(reso,ms));

const runDueSync = async()=>{
    const cutoff = new Date(Date.now() - SYNC_INTERVAL);
}
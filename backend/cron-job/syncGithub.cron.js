import cron from "node-cron";
import { User } from "../models/user.model.js";
import { syncGithubProfileForUser } from "../utils/githubSync.js";

const SYNC_INTERVAL = 24*60*60*60*1000;
const DELAY_BETWEEN_SYNCS_MS = 1500;

const sleep =(ms)=> new Promise((reso)=> setTimeout(reso,ms));

const runDueSync = async()=>{
    const cutoff = new Date(Date.now() - SYNC_INTERVAL);
    const dueUsers = await User.find({
        githubUsername: {$ne : null},
        $or : [{"githubProfile.lastSyncedAt": null},
            { "githubProfile.lastSyncedAt": { $lt: cutoff }}
        ]
    }).select("_id githubUsername");

    if(dueUsers.length === 0 ) return;
    console.log(`[github-sync-cron] Refreshing ${dueUsers.length} GitHub profile(s)...`);

    for(const user of dueUsers){
        await syncGithubProfileForUser(user._id, user.githubUsername);
        await sleep(DELAY_BETWEEN_SYNCS_MS);

    }
    console.log(`github cron done babu...`);
};

export const startGithubSyncCron = ()=>{
    cron.schedule("0 3 * * *",()=>{
        runDueSync()
        .catch((err)=>{
            console.error("github-cron-failed",err.message)
        });
    });

    setTimeout(()=>{
        runDueSync()
        .catch((err)=>{
            console.error("intial github cron failed", err.message)
        });
    },10_000);
    console.log("scheduled plus initaial cron for github passed-- ghar jake sutti babu")
}

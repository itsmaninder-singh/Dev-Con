import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

async function runBackfill() {
  if (!process.env.MONGO_URI) {
    console.error("No MONGO_URI provided in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("[backfill] Connected to MongoDB Atlas.");

  const users = await User.find({});
  console.log(`[backfill] Found ${users.length} users to process.`);

  let updatedCount = 0;
  for (const user of users) {
    const isComplete = user.calculateIsProfileComplete();
    const prev = user.isProfileComplete;

    user.isProfileComplete = isComplete;
    await user.save({ validateBeforeSave: false });

    console.log(` -> User "${user.name}" (@${user.username}): was=${prev}, now=${isComplete} (name=${Boolean(user.name)}, bio=${Boolean(user.bio?.length >= 10)}, college=${Boolean(user.college)}, skills=${user.skills?.length || 0})`);
    updatedCount++;
  }

  console.log(`[backfill] Successfully backfilled ${updatedCount} users.`);
  await mongoose.disconnect();
}

runBackfill().catch((err) => {
  console.error("[backfill] Error:", err);
  process.exit(1);
});

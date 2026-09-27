import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { validateEnv } from "./config/env.js";

// Validate required environment variables before initializing services
validateEnv();

import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import app from "./app.js";
import connectDB from "./db/index.js";
import initSocket from "./socket/index.js";
import { initCollabNamespace } from "./socket/collab.namespace.js";
import { setIO } from "./utils/SocketManager.js";
import { connectRedis, isRedisAvailable } from "./config/redis.js";
import redisClient from "./config/redis.js";
import { startGithubSyncCron } from "./cron-job/syncGithub.cron.js";

const PORT = Number(process.env.PORT) || 6969;

let httpServerInstance;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  try {
    await redisClient.del("online_users");
  } catch (_) {}

  let socketAdapter;
  if (isRedisAvailable()) {
    try {
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      pubClient.on("error", (err) => console.warn("[redis pub] Adapter error:", err.message));
      subClient.on("error", (err) => console.warn("[redis sub] Adapter error:", err.message));
      await pubClient.connect();
      await subClient.connect();
      socketAdapter = createAdapter(pubClient, subClient);
    } catch (err) {
      console.warn("[redis] Redis socket adapter initialization failed, using default adapter:", err.message);
    }
  }

  const clientOrigins = [
    ...new Set([
      ...(process.env.CLIENT_URL || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
    ]),
  ];

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigins,
      credentials: true,
    },
    ...(socketAdapter ? { adapter: socketAdapter } : {}),
  });
  initSocket(io);
  initCollabNamespace(io);
  setIO(io);
  startGithubSyncCron();
  httpServerInstance = httpServer.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
    );
  });
};

startServer().catch((error) => {
  console.error(`Error connecting to MongoDB/Redis: ${error.message}`);
  process.exit(1);
});

export { httpServerInstance as server };


import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ProjectFile } from "../models/projectFile.model.js";
import { CollabRoom } from "../models/collabRoom.model.js";
import { canJoinRoom, canEditRoom } from "../services/collaboration/roomAuth.js";
import {
  applyUpdate,
  getFullState,
  evictDoc,
} from "../services/collaboration/yjsRedisPersistence.js";
import redisClient from "../config/redis.js";

const presenceKey = (projectId) => `collab:presence:${projectId}`;

const initCollabNamespace = (io) => {
  const collab = io.of("/collab");

  collab.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Not authorized, no token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Not authorized, invalid token"));
    }
  });

  collab.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    socket.on("room:join", async (projectId, callback) => {
      try {
        const result = await canJoinRoom(projectId, userId);
        if (!result.allowed) {
          return callback?.({ ok: false, error: result.reason });
        }

        socket.join(`project:${projectId}`);
        socket.data.projectId = projectId;

        await redisClient.hSet(presenceKey(projectId), socket.id, JSON.stringify({
          userId,
          name: socket.user.name,
          currentFile: null,
          joinedAt: Date.now(),
        }));

        await CollabRoom.findOneAndUpdate(
          { project: projectId },
          {
            status: "active",
            lastActivityAt: new Date(),
            $push: { sessionLog: { user: userId, joinedAt: new Date() } },
          },
          { upsert: true }
        );

        const rawPresence = await redisClient.hGetAll(presenceKey(projectId));
        const participants = Object.values(rawPresence).map((p) => JSON.parse(p));

        socket.to(`project:${projectId}`).emit("presence:joined", {
          userId,
          name: socket.user.name,
        });

        callback?.({ ok: true, participants });
      } catch (err) {
        callback?.({ ok: false, error: "Failed to join room" });
      }
    });

    socket.on("file:open", async (fileId, callback) => {
      try {
        const file = await ProjectFile.findById(fileId);
        if (!file || file.isDeleted) {
          return callback?.({ ok: false, error: "File not found" });
        }

        const projectId = socket.data.projectId;
        if (!projectId || file.project.toString() !== projectId) {
          return callback?.({ ok: false, error: "File does not belong to joined project" });
        }

        socket.join(`file:${fileId}`);

        const state = await getFullState(fileId);

        const raw = await redisClient.hGet(presenceKey(projectId), socket.id);
        if (raw) {
          const presence = JSON.parse(raw);
          presence.currentFile = fileId;
          await redisClient.hSet(presenceKey(projectId), socket.id, JSON.stringify(presence));
        }

        socket.to(`project:${projectId}`).emit("presence:file-change", {
          userId,
          fileId,
        });

        callback?.({ ok: true, state: Buffer.from(state).toString("base64") });
      } catch (err) {
        callback?.({ ok: false, error: "Failed to open file" });
      }
    });

    socket.on("file:update", async ({ fileId, update }) => {
      try {
        const editCheck = await canEditRoom(socket.data.projectId, userId);
        if (!editCheck.allowed) return;

        const binaryUpdate = Buffer.from(update, "base64");
        await applyUpdate(fileId, binaryUpdate);

        await ProjectFile.findByIdAndUpdate(fileId, { lastEditedBy: userId });

        socket.to(`file:${fileId}`).emit("file:update", {
          fileId,
          update,
          from: userId,
        });
      } catch (err) {
        socket.emit("file:error", { fileId, error: "Update failed" });
      }
    });

    socket.on("file:awareness", ({ fileId, awareness }) => {
      socket.to(`file:${fileId}`).emit("file:awareness", {
        fileId,
        userId,
        awareness,
      });
    });

    socket.on("file:close", (fileId) => {
      socket.leave(`file:${fileId}`);
    });

    socket.on("disconnect", async () => {
      const projectId = socket.data.projectId;
      if (!projectId) return;

      await redisClient.hDel(presenceKey(projectId), socket.id);

      const remaining = await redisClient.hLen(presenceKey(projectId));
      if (remaining === 0) {
        await CollabRoom.findOneAndUpdate(
          { project: projectId },
          { status: "idle" }
        );
      }

      socket.to(`project:${projectId}`).emit("presence:left", { userId });
    });
  });

  return collab;
};

export { initCollabNamespace };

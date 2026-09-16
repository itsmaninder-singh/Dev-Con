import "./index.js";
import { disconnectDB } from "./db/index.js";

process.on("uncaughtException", (err) => {
  if (err?.code === "ECONNRESET" || err?.message?.includes("ECONNRESET")) {
    console.warn("[server] Transient socket reset encountered (ECONNRESET), keeping server alive:", err.message);
    return;
  }
  console.error("Uncaught exception, shutting down:", err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down....");
  console.error(err?.name, err?.message);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});
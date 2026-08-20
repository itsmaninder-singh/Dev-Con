/*import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({limit:"5mb"}));
app.use(express.urlencoded({extended:true,limit:"5mb"}));


export default app;*/

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { router } from "./routes/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

if (!process.env.CLIENT_URL) {
  console.warn(
    "[cors] CLIENT_URL is not set in .env - falling back to http://localhost:3000. Set CLIENT_URL before deploying."
  );
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(mongoSanitize());
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down" },

});
app.use(globalLimiter);
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "DevConnect API running" });
});

app.use("/api/v1", router);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;
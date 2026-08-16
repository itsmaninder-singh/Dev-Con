import express from "express";
import { searchUsers } from "../controller/search.controller.js";
import { attachUserIfPresent } from "../middleware/auth.middleware.js";

const searchRouter = express.Router();
searchRouter.get("/users", attachUserIfPresent, searchUsers);

export { searchRouter };

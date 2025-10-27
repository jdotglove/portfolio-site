import express from "../../plugins/express";
import {
  knowledgeNest,
} from "./handlers";

const router = express.Router();

// Support both GET (for SSE) and POST (for regular requests)
router.get("/", knowledgeNest);
router.post("/", knowledgeNest);

export default router;
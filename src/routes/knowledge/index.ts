import express from "../../plugins/express";
import {
  knowledgeNest,
} from "./handlers";

const router = express.Router();

router.post("/", knowledgeNest);

export default router;
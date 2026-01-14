import express from "../../plugins/express";
import {
  getUserConversations,
} from "./handlers";

const router = express.Router();

router.get(["/conversations", "/conversations/"], getUserConversations);

export default router;
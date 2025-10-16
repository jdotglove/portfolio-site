import express from "../../plugins/express";
import {
  getConversations,
  createConversation,
  getConversationMessages,
} from "./handlers";

const router = express.Router();

router.get("/", getConversations);
router.post("/", createConversation);
router.get(["/:conversationId/messages", "/:conversationId/messages/"], getConversationMessages);

export default router;
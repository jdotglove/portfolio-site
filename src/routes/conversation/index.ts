import express from "../../plugins/express";
import {
  getConversations,
  createConversation,
  getConversationMessages,
  getCouncilMembers,
  saveCouncilMembers,
} from "./handlers";

const router = express.Router();

router.get("/", getConversations);
router.post("/", createConversation);
router.get(["/:conversationId/messages", "/:conversationId/messages/"], getConversationMessages);
router.get(["/:conversationId/council", "/:conversationId/council/"], getCouncilMembers);
router.post(["/:conversationId/council", "/:conversationId/council/"], saveCouncilMembers);

export default router;
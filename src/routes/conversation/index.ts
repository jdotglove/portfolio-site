import express from "../../plugins/express";
import {
  createConversation,
  getConversationMessages,
  getCouncilMembers,
  saveCouncilMembers,
} from "./handlers";

const router = express.Router();

router.post("/", createConversation);
router.get(["/:conversationId/messages", "/:conversationId/messages/"], getConversationMessages);
router.get(["/:conversationId/council", "/:conversationId/council/"], getCouncilMembers);
router.post(["/:conversationId/council", "/:conversationId/council/"], saveCouncilMembers);

export default router;
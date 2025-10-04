import { Request, Response } from "../../plugins/express";
import { SERVER_RESPONSE_CODES, decodeSessionToken } from "../../utils/constants";
import WebSocket from "ws";

/**
 * @function knowledgeNest
 * @param req
 * @member body.message - Message to use for access to knowledge
 * @member body.conversationId - Conversation ID to use for access to knowledge
 */
export const knowledgeNest = async (req: Request, res: Response) => {
  let payload, statusCode;

  try {
    // Get session token from cookies
    const sessionToken = req.cookies?.session_token;
    if (!sessionToken) {
      res.status(SERVER_RESPONSE_CODES.FORBIDDEN).send({
        success: false,
        message: "No session token found",
      }).end();
      return;
    }

    // Decode session token to get userId
    const decodedToken = decodeSessionToken(sessionToken);
    if (!decodedToken) {
      res.status(SERVER_RESPONSE_CODES.FORBIDDEN).send({
        success: false,
        message: "Invalid session token",
      }).end();
      return;
    }

    //const ws = new WebSocket(`${process.env.WEB_SOCKET_URL}`);
    //ws.onopen = () => {
    //  ws.send(JSON.stringify({ message: req.body.message, userId: decodedToken.userId, conversationId: req.body.conversationId }));
    //};

    payload = { success: true };
    statusCode = SERVER_RESPONSE_CODES.ACCEPTED;
  } catch (error: any) {
    const errorObj = error.response ? {
      status: error.response.status,
      message: error.response.statusText || error.message,
    } : {
      status: SERVER_RESPONSE_CODES.SERVER_ERROR,
      message: error.message,
    };

    console.error(`Error access knowledge ${errorObj.message}`);
    payload = { error: errorObj.message };
    statusCode = errorObj.status;
  } finally {
   res.status(statusCode).send(payload).end();
  }
}
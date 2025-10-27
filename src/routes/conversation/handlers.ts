import "dotenv/config";

import { Request, Response } from "../../plugins/express";
import axios from "../../plugins/axios";
import { SERVER_RESPONSE_CODES, decodeSessionToken } from "../../utils/constants";

/**
 * @function getConversations
 * @param req
 * @returns List of conversations
 */
export const getConversations = async (req: Request, res: Response) => {
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

    const response = await axios(`${process.env.API_BASE_URL}/conversation`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      params: {
        userId: decodedToken.userId,
      },
    });
  
    res.status(SERVER_RESPONSE_CODES.ACCEPTED).send({
      success: true,
      conversations: response.data.conversations,
    }).end();
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    res.status(SERVER_RESPONSE_CODES.SERVER_ERROR).send({
      success: false,
      message: error.response?.data?.message || error.response?.statusText,
    }).end();
  }
}

/**
 * @function createConversation
 * @param req
 * @returns Created conversation
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name: conversationName } = req.body;
      
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
      
    const response = await axios(`${process.env.API_BASE_URL}/conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      data: {
        name: conversationName,
        userId: decodedToken.userId,
      },
    });
  
    res.status(SERVER_RESPONSE_CODES.CREATED).send({
      success: true,
      conversation: response.data.conversation,
    }).end();
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    res.status(SERVER_RESPONSE_CODES.SERVER_ERROR).send({
      success: false,
      message: error.response?.data?.message || error.response?.statusText,
    }).end();
  }
}

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const sessionToken = req.cookies?.session_token;
    if (!sessionToken) {
      res.status(SERVER_RESPONSE_CODES.FORBIDDEN).send({
        success: false,
        message: "No session token found",
      }).end();
      return;
    }

    const decodedToken = decodeSessionToken(sessionToken);
    if (!decodedToken) {
      res.status(SERVER_RESPONSE_CODES.FORBIDDEN).send({
        success: false,
        message: "Invalid session token",
      }).end();
      return;
    }

    const response = await axios(`${process.env.API_BASE_URL}/conversation/${conversationId}/messages`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    });

    res.status(SERVER_RESPONSE_CODES.ACCEPTED).send({
      success: true,
      messages: response.data.messages,
    }).end();
  } catch (error: any) {
    console.error("Error fetching conversation messages:", error);
    res.status(SERVER_RESPONSE_CODES.SERVER_ERROR).send({
      success: false,
      message: error.response?.data?.message || error.response?.statusText,
    }).end();
  }
}
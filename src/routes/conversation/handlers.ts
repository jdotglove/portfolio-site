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
  let payload;
  let statusCode: number;
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
  
    payload = {
      success: true,
      conversations: response.data.conversations,
    }
    statusCode = SERVER_RESPONSE_CODES.ACCEPTED;
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    payload = {
      success: false,
      message: error.response?.data?.message || error.response?.statusText,
    };
    statusCode = SERVER_RESPONSE_CODES.SERVER_ERROR;
  }
  
  res.status(statusCode).send(payload).end();
}

/**
 * @function createConversation
 * @param req
 * @returns Created conversation
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
  let payload;
  let statusCode: number;
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
  
    payload = {
      success: true,
      conversation: response.data.conversation,
    };
    statusCode = SERVER_RESPONSE_CODES.CREATED;
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    payload = {
      success: false,
      message: error.response?.data?.message || error.response?.statusText,
    };
    statusCode = SERVER_RESPONSE_CODES.SERVER_ERROR;
  }
    
  res.status(statusCode).send(payload).end();
}
  
export const getConversationMessages = async (req: Request, res: Response) => {
  let payload;
  let statusCode: number;
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
    payload = {
      success: true,
      messages: response.data.messages,
    };
    statusCode = SERVER_RESPONSE_CODES.ACCEPTED;

  } catch (error: any) {
    console.error("Error fetching conversation messages:", error);
    payload = {
      success: false,
      message: error.response?.data?.message || error.response?.statusText,
    };
    statusCode = SERVER_RESPONSE_CODES.SERVER_ERROR;
  }
  res.status(statusCode).send(payload).end();
}

export const getCouncilMembers = async (req: Request, res: Response) => {
  let payload;
  let statusCode: number;
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

    const response = await axios(`${process.env.API_BASE_URL}/conversation/${conversationId}/council`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    });

    payload = {
      success: true,
      councilMembers: response.data.councilMembers,
    };
    statusCode = SERVER_RESPONSE_CODES.ACCEPTED;
  } catch (error: any) {
    console.error("Error fetching council members:", error);

    payload = {
      success: false,
      message: error.response?.data?.message || error.response?.statusText,
    };
    statusCode = SERVER_RESPONSE_CODES.SERVER_ERROR;
  }

  res.status(statusCode).send(payload).end();
}

export const saveCouncilMembers = async (req: Request, res: Response) => {
  let payload;
  let statusCode: number;
  try {
    const { conversationId } = req.params;
    const { councilMembers } = req.body;
    const sessionToken = req.cookies?.session_token;
    
    if (!sessionToken) {
      res.status(SERVER_RESPONSE_CODES.FORBIDDEN).send({
        success: false,
        message: "No session token found",
      }).end();
      return;
    }

    if (!councilMembers || !Array.isArray(councilMembers)) {
      res.status(SERVER_RESPONSE_CODES.BAD_PAYLOAD).send({
        success: false,
        message: "councilMembers array is required",
      }).end();
      return;
    }

    const response = await axios(`${process.env.API_BASE_URL}/conversation/${conversationId}/council`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      data: {
        councilMembers: councilMembers,
      },
    });

    payload = {
      success: true,
      councilMembers: response.data.councilMembers || councilMembers,
      message: response.data.message || "Council configuration saved successfully",
    };
    statusCode = SERVER_RESPONSE_CODES.ACCEPTED;
  } catch (error: any) {
    console.error("Error saving council members:", error);

    payload = {
      success: false,
      message: error.response?.data?.message || error.response?.statusText || "Error saving council configuration",
    };
    statusCode = error.response?.status || SERVER_RESPONSE_CODES.SERVER_ERROR;
  }

  res.status(statusCode).send(payload).end();
}
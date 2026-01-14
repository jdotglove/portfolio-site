import "dotenv/config";

import { Request, Response } from "../../plugins/express";
import axios from "../../plugins/axios";
import { SERVER_RESPONSE_CODES, decodeSessionToken } from "../../utils/constants";

/**
 * @function getConversations
 * @param req
 * @returns List of conversations
 */
export const getUserConversations = async (req: Request, res: Response) => {
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
  
      const response = await axios(`${process.env.API_BASE_URL}/user/${decodedToken.userId}/conversations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.API_KEY}`,
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
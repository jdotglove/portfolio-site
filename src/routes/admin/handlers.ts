import "dotenv/config";

import { Request, Response } from "../../plugins/express";
import axios from "../../plugins/axios";
import { SERVER_RESPONSE_CODES, decodeSessionToken } from "../../utils/constants";

/**
 * @function adminLogin
 * @param req
 * @member body.username - Message to use for access to knowledge
 * @member body.password - Message to use for access to knowledge
 */
export const adminLogin = async (req: Request, res: Response) => {
  let payload, statusCode;
  try {
    if (!req.body.username || !req.body.password) {
      throw new Error("Username and password are required");
    }
    
    const response = await axios(`${process.env.API_BASE_URL}/admin/login`, {
      method: "POST",
      data: {
        username: req.body.username,
        password: req.body.password,
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      }
    });

    statusCode = response.status;
    payload = {
      ...response.data,
    };

    // Store JWT session token in cookie if present in response
    if (response.data && response.data.session && response.data.session.token) {
      // Decode token to get user info before clearing old cookie
      const decodedToken = decodeSessionToken(response.data.session.token);
      const newUserId = decodedToken?.userId;
      
      // Clear any existing session cookie first to ensure clean state
      res.clearCookie("session_token", { path: "/" });
      
      // Set new session token
      res.cookie("session_token", response.data.session.token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/"
      });
      
      console.log("JWT session token stored in cookie for user:", newUserId || "unknown", "username:", decodedToken?.username || "unknown");
    }
  } catch (error: any) {
    const errorObj = {
      status: error.status || SERVER_RESPONSE_CODES.SERVER_ERROR,
      message: error.response?.data?.message || error.response?.statusText,
    };

    statusCode = errorObj.status
    payload = { message: errorObj.message }
    console.error(`SERVER - Error logging in admin: ${errorObj.message}`);
  } finally {
    res.status(statusCode).send(payload).end();
  }
}
/**
 * @function createAdmin
 * @param req
 * @member body.username - Message to use for access to knowledge
 * @member body.password - Message to use for access to knowledge
 */
export const createAdmin = async (req: Request, res: Response) => {
  let payload, statusCode;
  try {
    if (!req.body.username || !req.body.password) {
      throw new Error("Username and password are required");
    }
    
    const response = await axios(`${process.env.API_BASE_URL}/admin/create`, {
      method: "POST",
      data: {
        username: req.body.username,
        password: req.body.password,
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      }
    });

    statusCode = response.status;
    payload = {
      ...response.data,
    };

    // Store JWT session token in cookie if present in response
    if (response.data && response.data.session && response.data.session.token) {
      // Decode token to get user info before clearing old cookie
      const decodedToken = decodeSessionToken(response.data.session.token);
      const newUserId = decodedToken?.userId;
      
      // Clear any existing session cookie first to ensure clean state
      res.clearCookie("session_token", { path: "/" });
      
      // Set new session token
      res.cookie("session_token", response.data.session.token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/"
      });
      
      console.log("JWT session token stored in cookie for user:", newUserId || "unknown", "username:", decodedToken?.username || "unknown");
    }
  } catch (error: any) {
    const errorObj = {
      status: error.status || SERVER_RESPONSE_CODES.SERVER_ERROR,
      message: error.response?.data?.message || error.response?.statusText,
    };
    statusCode = errorObj.status;
    payload = { message: errorObj.message };
    console.error(`Error creating admin: ${errorObj.message}`);
  } finally {
    res.status(statusCode).send(payload).end();
  }
}

/**
 * @function adminLogout
 * @param req
 * Expires the session on the external API and clears the session cookie
 */
export const adminLogout = async (req: Request, res: Response) => {
  let payload, statusCode;
  try {
    // Get session token from cookie
    const sessionToken = req.cookies?.session_token;
    
    if (sessionToken) {
      // Decode token to get user info for logging
      const decodedToken = decodeSessionToken(sessionToken);
      const userId = decodedToken?.userId || "unknown";
      
      // Call external API to expire the session
      try {
        await axios(`${process.env.API_BASE_URL}/admin/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${process.env.API_KEY}`,
            "X-Session-Token": sessionToken, // Pass session token if API requires it
          }
        });
        console.log(`Session expired for user: ${userId}`);
      } catch (error: any) {
        // Log error but continue with cookie clearing
        console.error(`Error expiring session on external API: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Clear the session cookie
    res.clearCookie("session_token", { path: "/" });
    
    statusCode = SERVER_RESPONSE_CODES.ACCEPTED;
    payload = {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error: any) {
    const errorObj = {
      status: error.status || SERVER_RESPONSE_CODES.SERVER_ERROR,
      message: error.response?.data?.message || error.message || "Error during logout",
    };
    statusCode = errorObj.status;
    payload = { 
      success: false,
      message: errorObj.message 
    };
    console.error(`SERVER - Error during logout: ${errorObj.message}`);
    
    // Still try to clear the cookie even if there's an error
    res.clearCookie("session_token", { path: "/" });
  } finally {
    res.status(statusCode).send(payload).end();
  }
}
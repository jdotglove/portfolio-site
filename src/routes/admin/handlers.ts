import "dotenv/config";

import { Request, Response } from "../../plugins/express";
import axios from "../../plugins/axios";
import { SERVER_RESPONSE_CODES } from "../../utils/constants";

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
      res.cookie("session_token", response.data.session.token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/"
      });
      console.log("JWT session token stored in cookie");
    }
  } catch (error: any) {
    const errorObj = {
      status: error.status || SERVER_RESPONSE_CODES.SERVER_ERROR,
      message: error.response?.data?.message || error.response?.statusText,
    };

    statusCode = errorObj.status
    payload = { message: errorObj.message }
    console.error(`Error logging in admin: ${errorObj.message}`);
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

    statusCode = SERVER_RESPONSE_CODES.ACCEPTED;
    payload = {
      success: true,
    };
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
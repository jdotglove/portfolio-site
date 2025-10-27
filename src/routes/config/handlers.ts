import "dotenv/config";

import { SERVER_RESPONSE_CODES } from "../../utils/constants";
import { Request, Response } from "../../plugins/express";

/**
 * @function getAppConfig
 * @param req 
 * @param res 
 */
export const getAppConfig = async (_req: Request, res: Response) => {
    let payload, statusCode;
    try {
        payload = {
            success: true,
            config: {
                streamingEnabled: true,
                baseUrl: process.env.API_BASE_URL,
            },
        };
        statusCode = SERVER_RESPONSE_CODES.ACCEPTED;
    } catch (error: any) {
        const errorObj = {
            status: error.status || SERVER_RESPONSE_CODES.SERVER_ERROR,
            message: error.response?.data?.message || error.response?.statusText,
        };
        statusCode = errorObj.status;
        payload = { message: errorObj.message };
        console.error("Error fetching app config:", error);
    } finally {
        res.status(statusCode).send(payload).end();
    }
}
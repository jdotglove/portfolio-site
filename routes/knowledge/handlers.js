"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeNest = void 0;
const constants_1 = require("../../utils/constants");
/**
 * @function knowledgeNest
 * @param req
 * @member body.message - Message to use for access to knowledge
 * @member body.conversationId - Conversation ID to use for access to knowledge
 */
const knowledgeNest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let payload, statusCode;
    try {
        // Get session token from cookies
        const sessionToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.session_token;
        if (!sessionToken) {
            res.status(403 /* SERVER_RESPONSE_CODES.FORBIDDEN */).send({
                success: false,
                message: "No session token found",
            }).end();
            return;
        }
        // Decode session token to get userId
        const decodedToken = (0, constants_1.decodeSessionToken)(sessionToken);
        if (!decodedToken) {
            res.status(403 /* SERVER_RESPONSE_CODES.FORBIDDEN */).send({
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
        statusCode = 200 /* SERVER_RESPONSE_CODES.ACCEPTED */;
    }
    catch (error) {
        const errorObj = error.response ? {
            status: error.response.status,
            message: error.response.statusText || error.message,
        } : {
            status: 500 /* SERVER_RESPONSE_CODES.SERVER_ERROR */,
            message: error.message,
        };
        console.error(`Error access knowledge ${errorObj.message}`);
        payload = { error: errorObj.message };
        statusCode = errorObj.status;
    }
    finally {
        res.status(statusCode).send(payload).end();
    }
});
exports.knowledgeNest = knowledgeNest;

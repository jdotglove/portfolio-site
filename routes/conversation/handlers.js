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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationMessages = exports.createConversation = exports.getConversations = void 0;
require("dotenv/config");
const axios_1 = __importDefault(require("../../plugins/axios"));
const constants_1 = require("../../utils/constants");
/**
 * @function getConversations
 * @param req
 * @returns List of conversations
 */
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // Get session token from cookies
        const sessionToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.session_token;
        console.log(sessionToken, req.cookies);
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
        const response = yield (0, axios_1.default)(`${process.env.API_BASE_URL}/conversation`, {
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
        res.status(200 /* SERVER_RESPONSE_CODES.ACCEPTED */).send({
            success: true,
            conversations: response.data.conversations,
        }).end();
    }
    catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500 /* SERVER_RESPONSE_CODES.SERVER_ERROR */).send({
            success: false,
            message: ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || ((_d = error.response) === null || _d === void 0 ? void 0 : _d.statusText),
        }).end();
    }
});
exports.getConversations = getConversations;
/**
 * @function createConversation
 * @param req
 * @returns Created conversation
 */
const createConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { name: conversationName } = req.body;
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
        const response = yield (0, axios_1.default)(`${process.env.API_BASE_URL}/conversation`, {
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
        res.status(201 /* SERVER_RESPONSE_CODES.CREATED */).send({
            success: true,
            conversation: response.data.conversation,
        }).end();
    }
    catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500 /* SERVER_RESPONSE_CODES.SERVER_ERROR */).send({
            success: false,
            message: ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || ((_d = error.response) === null || _d === void 0 ? void 0 : _d.statusText),
        }).end();
    }
});
exports.createConversation = createConversation;
const getConversationMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { conversationId } = req.params;
        const sessionToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.session_token;
        if (!sessionToken) {
            res.status(403 /* SERVER_RESPONSE_CODES.FORBIDDEN */).send({
                success: false,
                message: "No session token found",
            }).end();
            return;
        }
        const decodedToken = (0, constants_1.decodeSessionToken)(sessionToken);
        if (!decodedToken) {
            res.status(403 /* SERVER_RESPONSE_CODES.FORBIDDEN */).send({
                success: false,
                message: "Invalid session token",
            }).end();
            return;
        }
        const response = yield (0, axios_1.default)(`${process.env.API_BASE_URL}/conversation/${conversationId}/messages`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${process.env.API_KEY}`,
            },
        });
        res.status(200 /* SERVER_RESPONSE_CODES.ACCEPTED */).send({
            success: true,
            messages: response.data.messages,
        }).end();
    }
    catch (error) {
        console.error("Error fetching conversation messages:", error);
        res.status(500 /* SERVER_RESPONSE_CODES.SERVER_ERROR */).send({
            success: false,
            message: ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || ((_d = error.response) === null || _d === void 0 ? void 0 : _d.statusText),
        }).end();
    }
});
exports.getConversationMessages = getConversationMessages;

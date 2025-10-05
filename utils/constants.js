"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeSessionToken = decodeSessionToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function decodeSessionToken(token) {
    try {
        // Note: In a real application, you would verify the token with a secret
        // For now, we'll just decode it without verification
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded;
    }
    catch (error) {
        console.error("Error decoding session token: ", error);
        return null;
    }
}

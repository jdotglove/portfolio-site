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
exports.createAdmin = exports.adminLogin = void 0;
require("dotenv/config");
const axios_1 = __importDefault(require("../../plugins/axios"));
/**
 * @function adminLogin
 * @param req
 * @member body.username - Message to use for access to knowledge
 * @member body.password - Message to use for access to knowledge
 */
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    let payload, statusCode;
    try {
        if (!req.body.username || !req.body.password) {
            throw new Error("Username and password are required");
        }
        const response = yield (0, axios_1.default)(`${process.env.API_BASE_URL}/admin/login`, {
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
        payload = Object.assign({}, response.data);
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
    }
    catch (error) {
        const errorObj = {
            status: error.status || 500 /* SERVER_RESPONSE_CODES.SERVER_ERROR */,
            message: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_c = error.response) === null || _c === void 0 ? void 0 : _c.statusText),
        };
        statusCode = errorObj.status;
        payload = { message: errorObj.message };
        console.error(`Error logging in admin: ${errorObj.message}`);
    }
    finally {
        res.status(statusCode).send(payload).end();
    }
});
exports.adminLogin = adminLogin;
/**
 * @function createAdmin
 * @param req
 * @member body.username - Message to use for access to knowledge
 * @member body.password - Message to use for access to knowledge
 */
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    let payload, statusCode;
    try {
        if (!req.body.username || !req.body.password) {
            throw new Error("Username and password are required");
        }
        const response = yield (0, axios_1.default)(`${process.env.API_BASE_URL}/admin/create`, {
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
        statusCode = 200 /* SERVER_RESPONSE_CODES.ACCEPTED */;
        payload = {
            success: true,
        };
    }
    catch (error) {
        const errorObj = {
            status: error.status || 500 /* SERVER_RESPONSE_CODES.SERVER_ERROR */,
            message: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || ((_c = error.response) === null || _c === void 0 ? void 0 : _c.statusText),
        };
        statusCode = errorObj.status;
        payload = { message: errorObj.message };
        console.error(`Error creating admin: ${errorObj.message}`);
    }
    finally {
        res.status(statusCode).send(payload).end();
    }
});
exports.createAdmin = createAdmin;

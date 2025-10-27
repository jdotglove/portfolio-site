"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("../../plugins/express"));
const handlers_1 = require("./handlers");
const router = express_1.default.Router();
router.post('/login', handlers_1.adminLogin);
router.post('/create', handlers_1.createAdmin);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("../../plugins/express"));
const handlers_1 = require("./handlers");
const router = express_1.default.Router();
router.post('/', handlers_1.knowledgeNest);
exports.default = router;

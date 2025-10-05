"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("../plugins/express"));
const knowledge_1 = __importDefault(require("./knowledge"));
const admin_1 = __importDefault(require("./admin"));
const conversation_1 = __importDefault(require("./conversation"));
const router = express_1.default.Router();
// General Routes
router.use('/knowledge', knowledge_1.default);
router.use('/admin', admin_1.default);
router.use('/conversation', conversation_1.default);
exports.default = router;

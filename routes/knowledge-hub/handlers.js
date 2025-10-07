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
/**
 * @function knowledgeNest
 * @param req
 * @member body.message - Message to use for access to knowledge
 */
const knowledgeNest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Request Body:", req.body);
        res.status(200 /* SERVER_RESPONSE_CODES.ACCEPTED */).send({
            success: true,
        }).end();
    }
    catch (error) {
        const errorObj = error.response ? {
            status: error.response.status,
            message: error.response.statusText || error.message,
        } : {
            status: 500 /* SERVER_RESPONSE_CODES.SERVER_ERROR */,
            message: error.message,
        };
        console.error(`Error access knowledge ${req.params.taskId}`, errorObj.message);
        res.status(errorObj.status).send({ error: errorObj.message }).end();
    }
});
exports.knowledgeNest = knowledgeNest;

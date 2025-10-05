import express from "../../plugins/express";
import {
    adminLogin,
    createAdmin,
} from "./handlers";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/create", createAdmin);

export default router;
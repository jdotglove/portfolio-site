import express from "../../plugins/express";
import {
    adminLogin,
    createAdmin,
} from "./handlers";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/login/", adminLogin);
router.post("/create", createAdmin);
router.post("/create/", createAdmin);

export default router;
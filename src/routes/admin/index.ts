import express from "../../plugins/express";
import {
    adminLogin,
    createAdmin,
    adminLogout,
} from "./handlers";

const router = express.Router();

router.post(["/login", "/login/"], adminLogin);
router.post(["/create", "/create/"], createAdmin);
router.post(["/logout", "/logout/"], adminLogout);

export default router;
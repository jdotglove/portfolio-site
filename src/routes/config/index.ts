import express from "../../plugins/express";
import {
  getAppConfig,
} from "./handlers";

const router = express.Router();

router.get("/", getAppConfig);

export default router;
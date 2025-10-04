import express, { Request, Response } from "./plugins/express";
import * as path from "path";
import router from "./routes";
import "dotenv/config";
import cookieParser from "cookie-parser";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "../public")));
app.use(cookieParser());
app.use('/api', router);

app.get("/", (_req: Request, res: Response) => {
    console.log("Serving index.html");
    res.sendFile(path.resolve(__dirname, "../public", "index.html"));
});

app.get("/knowledge-hub", (req: Request, res: Response) => {
    console.log("Serving knowledge-hub.html");
    res.sendFile(path.resolve(__dirname, "../public", "knowledge-hub.html"));
})

app.get("/login", (_req: Request, res: Response) => {
    console.log("Serving login.html");
    res.sendFile(path.resolve(__dirname, "../public", "login.html"));
});

app.get("/create-admin", (_req: Request, res: Response) => {
    console.log("Serving create-admin.html");
    res.sendFile(path.resolve(__dirname, "../public", "create-admin.html"));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
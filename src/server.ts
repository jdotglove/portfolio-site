import express, { Request, Response } from "./plugins/express";
import path from "path";
import router from "./routes";
import "dotenv/config";
import cookieParser from "cookie-parser";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use('/api', router);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/knowledge-hub", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/knowledge-hub.html"));
})

app.get("/login", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/create-admin", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/create-admin.html"));
});

app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
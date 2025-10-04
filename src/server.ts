import express, { Request, Response } from "./plugins/express";
import path from "path";
import router from "./routes";
import "dotenv/config";
import cookieParser from "cookie-parser";
import fs from "fs";

const app = express();
const port = 3000;

// Fix path resolution for production
const publicPath = path.join(__dirname, "../public");
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(cookieParser());
app.use('/api', router);

// Serve static files
app.use(express.static(publicPath));

app.get("/knowledge-hub", (req: Request, res: Response) => {
    const filePath = path.join(publicPath, "knowledge-hub.html");
    console.log("Serving knowledge-hub from:", filePath);
    
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        res.status(404).send("File not found").end();
    }
    
    res.sendFile(filePath);
})

app.get("/login", (_req: Request, res: Response) => {
    const filePath = path.join(publicPath, "login.html");
    console.log("Serving login from:", filePath);
    
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        res.status(404).send("File not found").end();
    }
    
    res.sendFile(filePath);
});

app.get("/create-admin", (_req: Request, res: Response) => {
    const filePath = path.join(publicPath, "create-admin.html");
    console.log("Serving create-admin from:", filePath);
    
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        res.status(404).send("File not found").end();
    }
    
    res.sendFile(filePath);
});

app.get("/", (_req: Request, res: Response) => {
    const filePath = path.join(publicPath, "index.html");
    console.log("Serving index from:", filePath);
    
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        res.status(404).send("File not found").end();
    }
    
    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
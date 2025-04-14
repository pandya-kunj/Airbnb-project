
import {config} from "dotenv"
config({path: "./config.env"});


import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import {removeUnverifiedAccounts} from "./automation/removeUnverifiedAccounts.js"
import propertyRoutes from "./routes/propertyRoutes.js";

export const app = express();



app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
})
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.use("/api/v1/user", userRouter);

app.use("/api/properties", propertyRoutes);

console.log("Twilio SID:", process.env.TWILIO_SID);

removeUnverifiedAccounts();

connection();



app.use(errorMiddleware);
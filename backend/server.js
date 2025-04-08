import { app } from "./app.js";
import { config } from "dotenv";
config();


app.listen(process.env.PORT, () => {
    console.log(`server listining on port ${process.env.PORT}`);
});
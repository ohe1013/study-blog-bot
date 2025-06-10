import express from "express";
import dotenv from "dotenv";
import router from "./routes";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.static("../frontend")); // index.html 제공
app.use("/", router);

app.listen(PORT, () => {
  console.log(`✅ Server is running: http://localhost:${PORT}`);
});

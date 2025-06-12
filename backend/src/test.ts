import { generateStudyBlogPost } from "./geminiWriter";

import dotenv from "dotenv";

dotenv.config();

async function test() {
  // console.log(process.env.GEMINI_API_KEY);
  const text = await generateStudyBlogPost();
  console.log("📝 Gemini 생성 결과:\n", text);
}

test();

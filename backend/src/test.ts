import { generateStudyBlogPost } from "./geminiWriter";

async function test() {
  const text = await generateStudyBlogPost();
  console.log("📝 Gemini 생성 결과:\n", text);
}

test();

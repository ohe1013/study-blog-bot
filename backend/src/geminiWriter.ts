// backend/src/geminiWriter.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateStudyBlogPost(): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `
Please write a Korean blog post of at least 500 characters following the rules below. The topic is about studying IELTS using a learning sheet.

1. Title must include one of the following keywords: 아이엘츠학습지, 아이엘츠후기, 아이엘츠독학, 아이엘츠인강, 아이엘츠6, 아이엘츠내돈내산.
2. In the body, insert at least two hashtags from this list: #IELTS #아이엘츠공부 #아이엘츠환급 #아이엘츠인강추천 #시원스쿨아이엘츠.
3. End the post with the sentence: "본 포스팅은 직접 체험한 내용이며, 공부습관챌린지 환급 참여를 위한 포스팅입니다."
4. Also include the following URL at the end: https://bit.ly/3GN3fpt.
5. Content should be in a casual and personal blog style ( i'm 33 years old man).
6. 2025-06-10 is my first study day 
7. The content should mention what was studied that day and any difficulties or insights.

Now write a Day 1 post for someone who studied the IELTS Listening part for one hour and did shadowing practice.

`;

  const result = await model.generateContent(prompt);
  const blogPost = await result.response.text();

  return blogPost;
}

export async function uploadPhotoToNaver(
  accessToken: string,
  filePath: string
): Promise<string> {
  const form = new FormData();
  form.append("image", fs.createReadStream(filePath));

  const response = await axios.post(
    "https://openapi.naver.com/blog/uploadPhoto.json",
    form,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      },
    }
  );

  return response.data.result.url;
}

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
너는 IELTS 공부습관 챌린지를 기록하는 학생이야. 아래 조건을 참고해서 블로그 글을 작성해줘.
- 오늘 공부한 파트 (리스닝, 쉐도잉 등)
- 느낀 점, 어려웠던 점
- 공부 방법, 효과
- 앞으로의 다짐
자연스럽고 간단한 블로그 스타일로 300자 이상 부탁해.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
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

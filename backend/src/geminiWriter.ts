import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini가 반환할 데이터의 타입을 정의합니다.
export interface BlogPostData {
  title: string;
  body: string[]; // 본문을 문단별 배열로 받습니다.
  tags: string[];
}

export async function generateStudyBlogPost(): Promise<BlogPostData> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    generationConfig: {
      // JSON 출력을 강제합니다.
      responseMimeType: "application/json",
    },
    // 안전 설정을 조정하여 출력이 차단될 가능성을 줄입니다.
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  const prompt = `
Please create a Korean blog post about studying IELTS with a learning sheet, following the rules below.
The output MUST be a valid JSON object with the keys "title", "body", and "tags".

- "title": A string. Must include one keyword from [아이엘츠학습지, 아이엘츠후기, 아이엘츠독학, 아이엘츠인강, 아이엘츠6, 아이엘츠내돈내산].
- "body": An array of strings, where each string is a paragraph.
  - The content should be in a casual, personal blog style for a 33-year-old man. 나이를 언급하라는게아니고 그냥 이 나이대 톤으로 써달라는거임.
  - Today is the first study day, June 12, 2025. 이날을 기준으로 title의 날짜나 내용의 날짜도 변경되어야함
  - Mention studying IELTS Listening for one hour and doing shadowing practice.
  - Include difficulties or insights from the study session.
  - Total character count should be at least 500 characters.
- "tags": An array of strings. Must include at least two hashtags from [#IELTS, #아이엘츠공부, #아이엘츠환급, #아이엘츠인강추천, #시원스쿨아이엘츠].

Example JSON format:
{
  "title": "아이엘츠독학 1일차 후기 (feat. 시원스쿨 학습지)",
  "body": [
    "안녕하세요, 33살 직장인입니다. 오늘부터 큰맘 먹고 아이엘츠 독학을 시작했습니다.",
    "첫날이라 가볍게 리스닝 파트를 1시간 정도 공부하고, 쉐도잉 연습을 좀 해봤습니다. 생각보다 발음이 꼬여서 쉽지 않더라고요.",
    "꾸준히 하다 보면 늘겠죠? 내일도 파이팅입니다."
  ],
  "tags": ["#아이엘츠독학", "#IELTS"]
}
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Gemini가 생성한 JSON 텍스트를 파싱하여 객체로 변환합니다.
  const blogPost: BlogPostData = JSON.parse(responseText);

  return blogPost;
}

// 참고: Naver OpenAPI를 통한 이미지 업로드는 Puppeteer 방식과 중복되므로,
// Puppeteer로 통일하는 것이 좋습니다. 이 함수는 주석 처리하거나 삭제합니다.
/*
export async function uploadPhotoToNaver(...) { ... }
*/

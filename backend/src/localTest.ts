import dotenv from "dotenv";
dotenv.config();

import { generateStudyBlogPost } from "./geminiWriter";
import fs from "fs";
import path from "path";

async function main() {
  try {
    console.log("1. Gemini를 통해 블로그 포스트 데이터 생성을 시작합니다...");
    // 1. Gemini를 통해 구조화된 포스트 데이터(제목, 본문, 태그)를 가져옵니다.
    const geminiData = await generateStudyBlogPost();
    console.log("   - 제목:", geminiData.title);
    console.log("   - 태그:", geminiData.tags.join(", "));

    console.log("\n2. 로컬 'uploads' 폴더에서 이미지 목록을 읽어옵니다...");
    // 2. 'uploads' 폴더에서 이미지 파일 경로 목록을 가져옵니다.
    const uploadsDir = path.resolve(__dirname, "../uploads");
    const imageFiles = fs.existsSync(uploadsDir)
      ? fs.readdirSync(uploadsDir)
      : [];
    // Puppeteer에서 사용하기 위해 절대 경로로 변환합니다.
    const imagePaths = imageFiles.map((file) => path.join(uploadsDir, file));
    console.log(`   - 찾은 이미지: ${imagePaths.length}개`);

    console.log("\n3. 최종 포스팅 데이터를 JSON으로 조립합니다...");
    // 3. 최종적으로 Puppeteer가 사용할 모든 데이터를 하나의 객체로 합칩니다.
    const finalPostData = {
      title: geminiData.title,
      body: geminiData.body,
      images: imagePaths,
      tags: geminiData.tags,
      // 고정적으로 들어가는 문구와 URL도 여기에 포함합니다.
      sourceInfo:
        "본 포스팅은 직접 체험한 내용이며, 공부습관챌린지 환급 참여를 위한 포스팅입니다.",
      sourceUrl: "https://bit.ly/3GN3fpt",
    };

    // 4. 이 객체를 JSON 파일로 저장합니다.
    const outputPath = path.resolve(__dirname, "../post_data.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(finalPostData, null, 2),
      "utf-8"
    );

    console.log(
      `\n✅ 성공! 포스트 데이터가 다음 경로에 저장되었습니다: ${outputPath}`
    );
  } catch (err) {
    console.error("❌ 포스트 데이터 생성 중 오류 발생:", err);
  }
}

main();

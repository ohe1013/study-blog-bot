// backend/src/localTest.ts
import dotenv from "dotenv";
dotenv.config();

import { generateStudyBlogPost } from "./geminiWriter";
import fs from "fs";
import path from "path";

async function main() {
  try {
    // 1. Generate blog text via Gemini
    const blogText = await generateStudyBlogPost();

    // 2. Read uploaded images from local uploads folder
    const uploadsDir = path.resolve(__dirname, "../uploads");
    const images = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

    // 3. Build HTML content
    let html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>Auto Blog Post</title></head>
<body>`;

    // Insert images at the top
    for (const img of images) {
      const imgPath = path.relative(__dirname, path.join(uploadsDir, img));
      html += `<img src="${imgPath}" alt="공부사진" style="max-width: 600px; display: block; margin-bottom: 1em;"/>`;
    }

    // Insert generated text
    const paragraphs = blogText
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    html += paragraphs;

    html += `\n</body>\n</html>`;

    // 4. Write to output file
    const outputPath = path.resolve(__dirname, "../post.html");
    fs.writeFileSync(outputPath, html, "utf-8");
    console.log(`✅ Generated post at ${outputPath}`);
  } catch (err) {
    console.error("❌ Error generating post:", err);
  }
}

main();

// backend/src/routes.ts
import express from "express";
import multer from "multer";
import path from "path";
import { generateStudyBlogPost, uploadPhotoToNaver } from "./geminiWriter";
import { postToNaver } from "./naverUploader";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, "../uploads") });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) {
      res.status(400).send("이미지 업로드 실패");
      return;
    }

    const accessToken = process.env.NAVER_ACCESS_TOKEN!;
    const imageUrl = await uploadPhotoToNaver(accessToken, filePath);
    const blogText = await generateStudyBlogPost();
    const content = `<img src="${imageUrl}" alt="공부 인증샷" /><br/><br/>${blogText}`;
    const title = `공부습관 챌린지 ${new Date().toLocaleDateString()}`;

    const result = await postToNaver(accessToken, title, content);

    res.send(
      `✅ 포스팅 완료!<br/><a href="https://blog.naver.com/${result.blogId}/${result.logNo}" target="_blank">블로그 글 보기</a>`
    );
  } catch (err: any) {
    console.error("업로드 실패:", err);
    res.status(500).send("서버 에러: " + err.message);
  }
});
export default router;

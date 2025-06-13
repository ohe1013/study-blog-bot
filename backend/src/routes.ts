// backend/src/routes.ts
import express from "express";
import multer from "multer";
import { Storage } from "@google-cloud/storage";

import dotenv from "dotenv";
import sharp from "sharp";
dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket(process.env.GCS_BUCKET!);
router.post("/upload", upload.array("images", 5), async (req, res) => {
  if (!req.files || !(req.files as Express.Multer.File[]).length) {
    res.status(400).send("No files uploaded");
    return;
  }

  try {
    const results = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        // 1) sharp로 리사이즈·압축 (너비 1024px, JPEG 80% 퀄리티)
        const processed = await sharp(file.buffer)
          .resize({ width: 512, height: 512, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        // 2) GCS 업로드
        const filename = `${Date.now()}_${file.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        const blob = bucket.file(filename);
        const stream = blob.createWriteStream({
          metadata: { contentType: "image/jpeg" },
        });

        await new Promise<void>((resolve, reject) => {
          stream.on("finish", resolve);
          stream.on("error", reject);
          stream.end(processed);
        });

        // 3) 퍼블릭 URL 반환
        return `https://storage.googleapis.com/${bucket.name}/${filename}`;
      })
    );

    // 업로드된 URL 리스트를 클라이언트에 반환
    res.json({ urls: results });
  } catch (err) {
    console.error("Upload/processing error:", err);
    res.status(500).send("Upload failed");
  }
});
export default router;

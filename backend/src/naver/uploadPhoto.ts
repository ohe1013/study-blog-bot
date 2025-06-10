// backend/src/naver/uploadPhoto.ts
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

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

  // 성공 시 URL 리턴
  return response.data.result.url; // example: https://blogfiles.pstatic.net/MjAyXXXXXXX.png
}

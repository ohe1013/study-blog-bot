// backend/src/naverUploader.ts
import axios from "axios";

/**
 * 글을 네이버 블로그에 포스팅합니다.
 * @param accessToken OAuth2로 받은 액세스 토큰
 * @param title 블로그 글 제목
 * @param content 블로그 본문 (HTML 가능)
 */
export async function postToNaver(
  accessToken: string,
  title: string,
  content: string
) {
  const response = await axios.post(
    "https://openapi.naver.com/blog/writePost.json",
    {
      title,
      contents: content,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
}

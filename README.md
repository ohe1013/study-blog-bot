# Study-Blog-Bot 자동화 파이프라인

자동으로 이미지를 받아 블로그 포스트 HTML을 생성하고, Puppeteer로 네이버 블로그에 자동 게시까지 수행하는 전체 파이프라인을 설명합니다.

---

## 🔍 개요

이 프로젝트는 다음과 같은 흐름으로 동작합니다:

1. **이미지 업로드** (웹/로컬): `/uploads` 폴더 또는 Cloud Storage에 이미지가 저장됩니다.
2. **텍스트 생성 & HTML 조립**: `autoPublishWithPlaceholders.ts`가 Gemini API를 이용해 글을 생성하고, 지정된 placeholder에 이미지 태그를 삽입하여 `post.html` 파일을 만듭니다.
3. **블로그 자동 게시**: `publish.ts`가 Puppeteer를 이용해

   * 쿠키 자동 로드/저장으로 로그인 유지
   * “작성 중인 글이 있습니다.” 팝업 처리
   * 제목 및 본문 입력
   * 발행 버튼 클릭

---

## ⚙️ 설치 및 실행

1. **리포지토리 클론**

   ```bash
   git clone https://github.com/yourusername/study-blog-bot.git
   cd study-blog-bot/backend
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **환경 변수 설정**
   프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 채웁니다:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   NAVER_ID=your_naver_username
   NAVER_PW=your_naver_password
   NAVER_BLOG_ID=your_naver_blog_id
   ```

4. **이미지 업로드**
   `/uploads` 폴더에 이미지 파일을 복사합니다.

5. **텍스트 & HTML 생성**

   ```bash
   npx ts-node src/autoPublishWithPlaceholders.ts
   ```

   → `post.html` 파일이 생성됩니다.

6. **블로그 게시**

   ```bash
   npx ts-node src/publish.ts
   ```

   Puppeteer가 브라우저를 열고 자동 로그인 및 포스팅을 수행합니다.

---

## 📁 프로젝트 구조

```
study-blog-bot/
├── backend/
│   ├── uploads/               # 업로드된 이미지 폴더
│   ├── cookies.json           # 네이버 로그인 세션 쿠키
│   ├── post.html              # 조립된 블로그 HTML
│   └── src/
│       ├── autoPublishWithPlaceholders.ts  # 텍스트+이미지 → HTML 생성
│       ├── publish.ts         # Puppeteer 자동 포스팅 스크립트
│       └── generate.ts        # (선택) 이미지 기반 프롬프트 생성
├── .env                       # 환경변수 (gitignore 처리)
└── README.md                  # 이 파일
```

---

## 🔑 환경 변수

| 변수명              | 설명                                  |
| ---------------- | ----------------------------------- |
| `GEMINI_API_KEY` | Gemini API 호출용 키 (Google AI Studio) |
| `NAVER_ID`       | 네이버 로그인 아이디                         |
| `NAVER_PW`       | 네이버 로그인 비밀번호                        |
| `NAVER_BLOG_ID`  | 네이버 블로그 아이디 (`blog.naver.com/...`)  |

---

## 🚀 워크플로우 상세

1. **generateWithPlaceholders()**

   * `src/autoPublishWithPlaceholders.ts`에서 호출
   * 이미지 개수만큼 `[IMAGE_1]`… placeholder 포함 텍스트 요청

2. **assemblePost()**

   * placeholder → `<img src="uploads/...">` 교체
   * 최종 HTML 파일(`post.html`) 생성

3. **publishBlog()**

   * 쿠키 로드 → 자동 로그인 → draft 팝업 처리
   * 제목 `div.se-title-text`, 본문 `div[data-a11y-title="본문"] .se-module-text` 입력
   * 발행 버튼 `.publish_btn__m9KHH` 클릭

---

## 🛠️ 트러블슈팅

* **`.env` 로드 오류**: 프로젝트 루트에서 스크립트 실행 여부 확인
* **쿠키 문제**: `cookies.json` 삭제 후 재로그인
* **셀렉터 미반응**: DevTools로 최신 셀렉터 확인 후 코드 수정
* **Puppeteer 오류**: `--no-sandbox` 옵션 추가, 필요한 라이브러리 설치 여부 확인

---

## 📄 라이선스

MIT © Your Name

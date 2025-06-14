// backend/src/publish.ts
import puppeteer, { Page } from "puppeteer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { notifySlack } from "./notifySlack";

// --- 기본 설정 ---
dotenv.config();

// 파일 경로: HTML 대신 JSON 데이터를 사용합니다.
const COOKIE_PATH = path.resolve(__dirname, "../cookies.json");
const POST_DATA_PATH = path.resolve(__dirname, "../post_data.json");

// 환경 변수
const BLOG_ID = process.env.NAVER_BLOG_ID!;
const NAVER_ID = process.env.NAVER_ID!;
const NAVER_PW = process.env.NAVER_PW!;

// 포스트 데이터 타입을 정의합니다.
interface PostData {
  title: string;
  body: string[];
  images: string[];
  tags: string[];
  sourceInfo: string;
  sourceUrl: string;
}

// --- Puppeteer 헬퍼 함수 (기존과 거의 동일) ---

// 쿠키 로드 함수
async function loadCookies(page: Page) {
  if (fs.existsSync(COOKIE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_PATH, "utf-8"));
    await page.browserContext().setCookie(...cookies);
    console.log("✅ 쿠키를 성공적으로 불러왔습니다.");
  }
}

// 쿠키 저장 함수
async function saveCookies(page: Page) {
  const cookies = await page.browserContext().cookies();
  fs.writeFileSync(COOKIE_PATH, JSON.stringify(cookies, null, 2));
  console.log("✅ 쿠키를 저장했습니다. 다음 실행 시 로그인을 건너뜁니다.");
}

// 로그인 자동화 함수
async function login(page: Page) {
  console.log("🔐 로그인을 시작합니다...");
  await page.goto("https://nid.naver.com/nidlogin.login", {
    waitUntil: "networkidle2",
  });
  await page.evaluate(
    (id, pw) => {
      (document.querySelector("#id") as HTMLInputElement).value = id;
      (document.querySelector("#pw") as HTMLInputElement).value = pw;
    },
    NAVER_ID,
    NAVER_PW
  );
  await page.waitForSelector("button.btn_login");
  console.log("✅ 로그인 버튼 찾음");
  await page.click(`button.btn_login`);
  await page.waitForNavigation({ waitUntil: "networkidle2" });
  console.log("✅ 로그인 성공!");
  await saveCookies(page);
}
async function dismissPopup(page: Page, selector: string) {
  try {
    await page.waitForSelector(selector, { timeout: 3000 });
    await page.click(selector);
    console.log(`✅ 팝업(${selector}) 닫음`);
  } catch {
    /* 나타나지 않으면 넘어감 */
  }
}

// --- 새로운 포스팅 작업 함수들 ---

/** 제목을 입력합니다 */
async function typeTitle(page: Page, title: string) {
  console.log("✏️  제목을 입력합니다...");
  const titleSelector = "div.se-title-text";
  await page.waitForSelector(titleSelector);
  await page.click(titleSelector);
  await page.keyboard.type(title, { delay: 100 });
}

/** 본문을 한 문단씩 입력합니다 */
async function typeBody(
  page: Page,
  body: string[],
  sourceInfo: string,
  sourceUrl: string
) {
  console.log("✍️  본문을 입력합니다...");
  const bodySelector = "div.se-component-content .se-drop-indicator";
  await page.waitForSelector(bodySelector);
  await page.click(bodySelector);

  for (const paragraph of body) {
    await page.keyboard.type(paragraph, { delay: 50 });
    await page.keyboard.press("Enter");
    // await page.waitForTimeout(200); // 문단 사이 약간의 딜레이
  }

  // 마지막에 고정 문구와 URL 추가
  await page.keyboard.press("Enter");
  await page.keyboard.type(sourceInfo, { delay: 50 });
  await page.keyboard.press("Enter");
  await page.keyboard.type(sourceUrl, { delay: 50 });
}

/** 이미지를 업로드합니다 */
async function uploadImages(page: Page, imagePaths: string[]) {
  if (!imagePaths || imagePaths.length === 0) {
    console.log("ℹ️ 업로드할 이미지가 없습니다.");
    return;
  }
  console.log(`🖼️  ${imagePaths.length}개의 이미지를 업로드합니다...`);

  // '사진' 버튼을 클릭하면 파일 선택창이 뜨는 것을 기다립니다.
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser({ timeout: 5000 }),
    page.click("button.se-image-toolbar-button"),
  ]);

  // 파일 선택창에 이미지 경로들을 전달합니다.
  await fileChooser.accept(imagePaths);
  const popupSelector =
    ".se-popup-container.__se-pop-layer .se-image-type-label";
  await page.waitForSelector(popupSelector);
  page.click(popupSelector);
  await page.waitForFunction(
    (n) =>
      document.querySelectorAll("div.se-component-content img").length >= n,
    {},
    imagePaths.length
  );
  // 네이버 서버에 업로드가 완료될 때까지 충분히 기다립니다.
  // 이미지 1개당 5초로 계산 (네트워크 상황에 따라 조절 필요)
  console.log("   - 업로드 완료를 기다리는 중...");
  // await page.waitForTimeout(imagePaths.length * 5000);
}

/** 태그를 입력합니다 */
async function addTags(page: Page, tags: string[]) {
  if (!tags || tags.length === 0) {
    console.log("ℹ️ 추가할 태그가 없습니다.");
    return;
  }
  console.log("🏷️  태그를 입력합니다...");

  // '태그' 입력 영역을 클릭
  // const tagInputSelector = "input#tag-input";
  // await page.waitForSelector(tagInputSelector);
  // await page.click("div#tag-input");
  await page.evaluate(
    (id, pw) => {
      (document.querySelector("input#tag-input") as HTMLInputElement).click();
    },
    NAVER_ID,
    NAVER_PW
  );
  for (const tag of tags) {
    const cleanTag = tag.replace("#", ""); // '#'은 자동으로 붙으므로 제거
    await page.keyboard.type(cleanTag, { delay: 50 });
    await page.keyboard.press("Enter"); // 엔터로 태그 확정
    // await page.waitForTimeout(500); // 태그 입력 후 딜레이
  }
}

// --- 메인 실행 함수 ---
async function publishBlog() {
  // 1. 포스팅 데이터 로드
  if (!fs.existsSync(POST_DATA_PATH)) {
    console.error(`❌ 에러: 포스트 데이터 파일(${POST_DATA_PATH})이 없습니다.`);
    console.error("   먼저 'npm run generate'를 실행하여 데이터를 생성하세요.");
    return;
  }
  const postData: PostData = JSON.parse(
    fs.readFileSync(POST_DATA_PATH, "utf-8")
  );

  // 2. 브라우저 실행
  const browser = await puppeteer.launch({
    headless: true, // ← 반드시 true
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1400,1000",
    ],
    // executablePath: "/usr/bin/google-chrome-stable", // 필요 시 지정
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  // 3. 로그인 및 글쓰기 페이지 이동
  await loadCookies(page);
  await page.goto(`https://blog.naver.com/${BLOG_ID}`, {
    waitUntil: "networkidle2",
  });

  const isLoggedIn = await page.$(
    'a[href*="https://nid.naver.com/nidlogin.logout"]'
  );
  if (!isLoggedIn) {
    await login(page);
    await page.goto(`https://blog.naver.com/${BLOG_ID}`, {
      waitUntil: "networkidle2",
    });
  } else {
    console.log("✅ 이미 로그인된 상태입니다.");
  }

  await page.goto(
    `https://blog.naver.com/PostWriteForm.naver?blogId=${BLOG_ID}`,
    { waitUntil: "networkidle2" }
  );
  console.log(page.frames().map((f) => ({ name: f.name(), url: f.url() })));
  const editorFrame = page.frames().find((f) => f.name() === "mainFrame");
  if (!editorFrame) throw new Error("✋ mainFrame 프레임을 찾지 못했습니다!");

  // 4. 글쓰기 작업 수행
  console.log("🚀 글쓰기 작업 시작!");
  await dismissPopup(page, "button.se-popup-button-cancel");
  await dismissPopup(page, "button.se-help-panel-close-button");
  await typeTitle(page, postData.title);
  await typeBody(page, postData.body, postData.sourceInfo, postData.sourceUrl);
  await uploadImages(page, postData.images);

  // 5. 발행 준비
  await page.click("button.publish_btn__m9KHH");
  console.log("✅ 발행 버튼 클릭!");

  // 6. 태그 입력 및 최종 발행
  await page.waitForSelector("div.layer_publish__vA9PX"); // 발행 팝업이 뜰 때까지 대기
  await addTags(page, postData.tags);

  // 최종 발행 버튼 클릭 (실제 발행)
  await page.click("button.confirm_btn__WEaBq");
  console.log("🚀 포스팅을 최종 발행했습니다!");

  // 잠시 후 브라우저 종료
  // await page.waitForTimeout(5000);
  try {
    await notifySlack(`✅ 포스팅 완료: "${postData.title}"`, true, [
      {
        title: "채널",
        value: process.env.SLACK_CHANNEL || "#random",
        short: true,
      },
      { title: "이미지 수", value: `${postData.images.length}`, short: true },
    ]);
  } catch (err: any) {
    console.error("❌ 오류 발생:", err);
    await notifySlack(`❌ 포스팅 실패: ${err.message}`, false);
  } finally {
    if (browser) await browser.close();
  }
  await browser.close();
}

publishBlog().catch(console.error);

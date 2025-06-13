import {
  IncomingWebhook,
  IncomingWebhookDefaultArguments,
} from "@slack/webhook";
import dotenv from "dotenv";

dotenv.config();
if (!process.env.SLACK_WEBHOOK_URL) {
  throw new Error("SLACK_WEBHOOK_URL 환경변수가 설정되어 있지 않습니다.");
}

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

// 기본 메시지 포맷 (optional)
const defaultArgs: IncomingWebhookDefaultArguments = {
  username: "BlogBot", // 메시지를 보낼 때 표시될 봇 이름
  icon_emoji: ":robot_face:", // 봇 아이콘
};

export async function notifySlack(
  text: string,
  success: boolean,
  extraFields?: { title: string; value: string; short?: boolean }[]
) {
  const color = success ? "good" : "danger";

  const attachments = [
    {
      color,
      text,
      ts: String(Math.floor(Date.now() / 1000)),
      fields: extraFields,
    },
  ];

  await webhook.send({
    ...defaultArgs,
    attachments,
  });
}

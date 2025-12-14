import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";

export function isMailerConfigured(): boolean {
    return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true для 465
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

export async function sendVerificationCodeEmail(to: string, code: string) {
    if (!isMailerConfigured()) {
        throw new Error("SMTP is not configured");
    }

    const subject = "ArsGora — код подтверждения почты";

    const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.4;">
    <h2 style="margin: 0 0 12px;">Подтверждение почты</h2>
    <p style="margin: 0 0 12px;">
      Ваш код подтверждения:
    </p>
    <div style="
      display:inline-block;
      padding: 10px 14px;
      font-size: 22px;
      letter-spacing: 2px;
      font-weight: 700;
      border-radius: 10px;
      background: #f2f3f5;
      ">
      ${code}
    </div>
    <p style="margin: 12px 0 0; color:#666;">
      Код действует 10 минут. Если вы не регистрировались — просто игнорируйте это письмо.
    </p>
    <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />
    <div style="color:#999; font-size: 12px;">
      Powered by RMA · https://e-rma.ru/
    </div>
  </div>
  `;

    await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        html,
    });
}

const MAIL_API_URL = process.env.MAIL_API_URL;
const MAIL_API_KEY = process.env.MAIL_API_KEY;
const MAIL_APP_ID = process.env.MAIL_APP_ID || "arsgora";

export function isMailerConfigured(): boolean {
    return Boolean(MAIL_API_URL && MAIL_API_KEY);
}

export async function sendVerificationCodeEmail(to: string, code: string) {
    if (!isMailerConfigured()) {
        throw new Error("MAIL_API is not configured");
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

    const res = await fetch(MAIL_API_URL!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": MAIL_API_KEY!,
            "X-App-Id": MAIL_APP_ID,
        },
        body: JSON.stringify({
            to,
            subject,
            html,
        }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data?.error || `MAIL_API error ${res.status}`);
    }
}

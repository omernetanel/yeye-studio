import { SITE_NAME, SITE_URL, WHATSAPP_NUMBER } from "@/lib/site";

/**
 * THE MAIL A VISITOR GETS BACK THE MOMENT THEY SEND A FORM.
 *
 * It exists so nobody is left wondering whether the message arrived - the
 * thing that loses an enquiry is the silence after it, not the wait.
 *
 * WRITTEN FOR MAIL CLIENTS, NOT FOR THE SITE, which is why it breaks the site's
 * own rules on purpose: tables for layout, every style inline, colours as hex.
 * Gmail and Outlook strip <style> blocks and class names, ignore flex and grid,
 * and show neither SVG nor WebP - so the logo is a PNG under /images/email, and
 * everything else is what they all still render.
 *
 * The plain-text version goes with it, for clients that show no HTML at all.
 */

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
// WhatsApp's own green: the button reads as WhatsApp before its words do.
const WHATSAPP_GREEN = "#25D366";

/**
 * The visitor's name, only if it looks like one: letters, spaces, an
 * apostrophe or a hyphen, and short. The name field is free text, and this
 * mail goes to whatever address was typed - so anything else (a link, an
 * offer) would be the site mailing a stranger's words to a stranger. Then the
 * greeting is simply "היי,".
 */
export function greetingName(name: string) {
  const trimmed = name.trim();
  return /^[\p{L}\s'-]{1,30}$/u.test(trimmed) ? trimmed : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function confirmationEmail(name: string) {
  const who = greetingName(name);
  const hello = who ? `היי ${who},` : "היי,";

  const text = [
    hello,
    "",
    "קיבלתי את הפנייה שלך, תודה!",
    "בדרך כלל אחזור אליך בתוך יום עסקים אחד.",
    "",
    "בינתיים, כל מה שעולה לך בראש, רעיונות, אתרים שאהבת או שאלות,",
    `אפשר לשלוח לי ישר בוואטסאפ: ${WHATSAPP_URL}`,
    "בלי שפה רשמית, כותבים כמו שמדברים.",
    "",
    "עומר",
    SITE_NAME,
    SITE_URL.replace(/^https?:\/\//, ""),
  ].join("\n");

  const p = (content: string, extra = "") =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111;${extra}">${content}</p>`;

  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>קיבלתי את הפנייה שלך</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="max-width:520px;background:#ffffff;border-radius:16px;font-family:Arial,Helvetica,sans-serif;text-align:right;">
<tr><td align="center" style="padding:36px 32px 8px;">
<a href="${SITE_URL}" style="text-decoration:none;color:#111111;font-size:22px;font-weight:bold;letter-spacing:2px;"><img src="${SITE_URL}/images/email/logo.png" width="120" height="51" alt="${SITE_NAME}" style="display:block;border:0;width:120px;height:auto;"></a>
</td></tr>
<tr><td style="padding:28px 32px 8px;">
${p(escapeHtml(hello), "font-weight:bold;")}
${p("קיבלתי את הפנייה שלך, תודה!<br>בדרך כלל אחזור אליך בתוך יום עסקים אחד.")}
${p("בינתיים, כל מה שעולה לך בראש, רעיונות, אתרים שאהבת או שאלות, אפשר לשלוח לי ישר בוואטסאפ. בלי שפה רשמית, כותבים כמו שמדברים.")}
</td></tr>
<tr><td align="center" style="padding:8px 32px 4px;">
<a href="${WHATSAPP_URL}" style="display:inline-block;background:${WHATSAPP_GREEN};color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:999px;">לכתוב לי בוואטסאפ</a>
</td></tr>
<tr><td align="center" style="padding:10px 32px 0;">
<p style="margin:0;font-size:13px;line-height:1.6;color:#777777;">הכפתור לא עובד? <a href="${WHATSAPP_URL}" style="color:#777777;">${WHATSAPP_URL.replace("https://", "")}</a></p>
</td></tr>
<tr><td style="padding:28px 32px 36px;">
<div style="border-top:1px solid #e6e6e6;padding-top:20px;">
<p style="margin:0;font-size:15px;line-height:1.6;color:#111111;font-weight:bold;">עומר</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#777777;">${SITE_NAME} · <a href="${SITE_URL}" style="color:#777777;">${SITE_URL.replace(/^https?:\/\//, "")}</a></p>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: "קיבלתי את הפנייה שלך", html, text };
}

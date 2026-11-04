// Vercel serverless function: POST /api/book
// Emails each booking request to BOOKING_TO (default advmsk.legal@gmail.com) using Resend (resend.com).
// Environment variables: RESEND_API_KEY (required), BOOKING_TO, BOOKING_FROM (optional).
// ---- shared booking-email logic (same in api/book.js and netlify/functions/book.js) ----
const TO = process.env.BOOKING_TO || "advmsk.legal@gmail.com";
const FROM = process.env.BOOKING_FROM || "Adv. Sarfaraz Khan Website <onboarding@resend.dev>";

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clip = (s, n) => String(s == null ? "" : s).trim().slice(0, n);

function cleanBooking(b) {
  if (!b || typeof b !== "object") return null;
  const d = {
    name: clip(b.name, 120), phone: clip(b.phone, 40), email: clip(b.email, 160),
    matter: clip(b.matter, 60) || "Not specified", via: clip(b.via, 30) || "Not specified",
    lang: clip(b.lang, 30) || "English", message: clip(b.message, 3000), page: clip(b.page, 300)
  };
  if (!d.name || !d.message || (!d.phone && !d.email)) return null;
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) d.email = "";
  return d;
}

function buildEmail(d) {
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai", dateStyle: "full", timeStyle: "short" }) + " (UAE time)";
  const subject = `New consultation request: ${d.name} (${d.matter})`;
  const row = (k, v) => `<tr><td style="padding:12px 16px;border-bottom:1px solid #EFE6DC;color:#7A6A60;font-size:13px;width:38%;vertical-align:top">${k}</td><td style="padding:12px 16px;border-bottom:1px solid #EFE6DC;color:#2A1A16;font-size:14px;font-weight:600">${v}</td></tr>`;
  const phoneLink = d.phone ? `<a href="tel:${esc(d.phone.replace(/[^\d+]/g, ""))}" style="color:#82092C;text-decoration:none">${esc(d.phone)}</a>` : "Not given";
  const mailLink = d.email ? `<a href="mailto:${esc(d.email)}" style="color:#82092C;text-decoration:none">${esc(d.email)}</a>` : "Not given";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F4EEE7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE7;padding:28px 12px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E8DCCF">
<tr><td style="background:#240B05;padding:26px 30px;border-bottom:4px solid #C59F66">
  <div style="color:#C59F66;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700">Website booking</div>
  <div style="color:#FFFFFF;font-size:22px;font-family:Georgia,serif;margin-top:6px">New consultation request</div>
  <div style="color:#D3C2B4;font-size:13px;margin-top:4px">Adv. Sarfaraz Khan · Lawyer – Legal Consultant · UAE</div>
</td></tr>
<tr><td style="padding:26px 30px 8px;color:#2A1A16;font-size:15px;line-height:1.6">
  A new appointment request was submitted on the website. The client's details are below.
</td></tr>
<tr><td style="padding:8px 30px 4px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EFE6DC;border-radius:10px;border-collapse:separate;overflow:hidden">
${row("Client name", esc(d.name))}
${row("Matter", `<span style="display:inline-block;background:#F7E9EC;color:#82092C;padding:3px 10px;border-radius:20px;font-size:13px">${esc(d.matter)}</span>`)}
${row("Phone / WhatsApp", phoneLink)}
${row("Email", mailLink)}
${row("Preferred contact", esc(d.via))}
${row("Preferred language", esc(d.lang))}
${row("Submitted", esc(when))}
</table>
</td></tr>
<tr><td style="padding:20px 30px 6px">
  <div style="color:#7A6A60;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Client's message</div>
  <div style="background:#FBF7F2;border-left:4px solid #82092C;border-radius:6px;padding:16px 18px;color:#2A1A16;font-size:14px;line-height:1.65;white-space:pre-wrap">${esc(d.message)}</div>
</td></tr>
<tr><td style="padding:22px 30px 28px">
  ${d.email ? `<a href="mailto:${esc(d.email)}?subject=${encodeURIComponent("Your consultation request")}" style="display:inline-block;background:#82092C;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:30px;font-weight:700;font-size:14px">Reply to ${esc(d.name)}</a>` : ""}
  ${d.phone ? `<a href="https://wa.me/${esc(d.phone.replace(/\D/g, ""))}" style="display:inline-block;margin-left:6px;background:#FFFFFF;color:#82092C;border:1.5px solid #C59F66;text-decoration:none;padding:11px 20px;border-radius:30px;font-weight:700;font-size:14px">WhatsApp</a>` : ""}
</td></tr>
<tr><td style="background:#FBF7F2;padding:16px 30px;color:#8C7B70;font-size:12px;line-height:1.6;border-top:1px solid #EFE6DC">
  City Avenue Building, near City Centre Deira, Dubai, UAE · advmsk.legal@gmail.com<br>
  Sent automatically from the website booking form${d.page ? ` (${esc(d.page)})` : ""}.
</td></tr>
</table></td></tr></table></body></html>`;
  const text = `New consultation request\n\nClient name: ${d.name}\nMatter: ${d.matter}\nPhone / WhatsApp: ${d.phone || "Not given"}\nEmail: ${d.email || "Not given"}\nPreferred contact: ${d.via}\nPreferred language: ${d.lang}\nSubmitted: ${when}\n\nMessage:\n${d.message}\n`;
  return { subject, html, text };
}

async function sendBooking(raw) {
  if (raw && raw.website) return { status: 200, body: { ok: true } };          // spam trap
  const d = cleanBooking(raw);
  if (!d) return { status: 400, body: { ok: false, error: "Missing details" } };
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: 503, body: { ok: false, error: "Email not configured" } };   // page falls back to FormSubmit
  const m = buildEmail(d);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: TO.split(",").map(s => s.trim()), subject: m.subject, html: m.html, text: m.text, ...(d.email ? { reply_to: d.email } : {}) })
  });
  if (!r.ok) return { status: 502, body: { ok: false, error: "Email service error" } };
  return { status: 200, body: { ok: true } };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = null; } }
  try { const r = await sendBooking(body); return res.status(r.status).json(r.body); }
  catch (_) { return res.status(502).json({ ok: false }); }
}

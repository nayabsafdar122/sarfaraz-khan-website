// Vercel serverless function: POST /api/chat
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
// Shared logic: validate the chat, add the assistant's briefing, call Claude.
const SYSTEM = "You are the AI legal assistant on the website of Adv. Sarfaraz Khan, a Pakistani lawyer and legal consultant with over 10 years of experience in UAE law, holding a Master's Degree in Sharia and Law, associated with MAB Advocates & Legal Consultants. He speaks Arabic, English, Urdu and Hindi and assists clients across all 7 Emirates and from many countries.\nOffice: City Avenue Building, near City Centre Deira, Dubai, UAE. Email: advmsk.legal@gmail.com. No phone number is published; never invent one.\nPractice areas: Commercial Law & Business Disputes; Civil Law & Compensation Claims; Criminal Law & Case Advisory; Family Law & Personal Status; Inheritance, Succession & Estates; Cheque Execution & Financial Recovery; Road Traffic Accident & Personal Injury; Workplace Accident & Occupational Injury; Employment & Labour Disputes; Appeals, Cassation & Legal Memoranda. Also real estate and tenancy disputes under commercial law. He does NOT handle immigration or visa matters.\nCourt filings and representation are handled by licensed advocates of MAB Advocates & Legal Consultants.\nHow to answer: plain, warm, concise (at most about 110 words). Explain general UAE legal concepts and which practice area fits the visitor's situation, then invite them to use the \"Book an Appointment\" form on the website or email the office. Reply in the visitor's language (English, Arabic, Urdu or Hindi). Never give definitive legal advice, never predict outcomes, never quote fees, never invent phone numbers, case results or facts. If asked about immigration, say politely it is outside his practice. If a question is unrelated to legal help or the office, briefly steer back. No markdown headings or bold; short paragraphs or simple dashes only.";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const msgs = input.slice(-12)
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();      // must start with the visitor
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null; // must end with the visitor
  return msgs;
}

async function askClaude(messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 450, system: SYSTEM, messages })
  });
  if (r.status === 429) return { status: 429 };
  if (!r.ok) return { status: 502 };
  const data = await r.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  return text ? { status: 200, text } : { status: 502 };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "AI key not configured" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const messages = cleanMessages(body.messages);
  if (!messages) return res.status(400).json({ error: "Invalid messages" });
  try {
    const out = await askClaude(messages);
    if (out.status !== 200) return res.status(out.status).json({ error: "AI unavailable" });
    return res.status(200).json({ text: out.text });
  } catch (e) {
    return res.status(502).json({ error: "AI unavailable" });
  }
}

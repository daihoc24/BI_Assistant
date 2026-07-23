import type { Evidence } from "./types";

type ChatCompletion = { choices?: Array<{ message?: { content?: string } }> };

const baseUrl = () => (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const model = () => process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

export function isAiConfigured() { return Boolean(process.env.OPENAI_API_KEY); }

export function buildGroundedPrompt(question: string, evidence: Evidence[], actions: string[]) {
  return [
    "Bạn là Business Intelligence Assistant. Chỉ được kết luận từ EVIDENCE bên dưới.",
    "Trả lời ngắn gọn bằng tiếng Việt, nêu rõ giới hạn khi evidence không đủ.",
    "Không bịa số liệu, không tạo khuyến nghị ngoài danh sách hành động được cung cấp.",
    `CÂU HỎI: ${question}`,
    `EVIDENCE: ${JSON.stringify(evidence)}`,
    `HÀNH ĐỘNG ĐƯỢC PHÉP ĐỀ XUẤT: ${JSON.stringify(actions)}`
  ].join("\n\n");
}

export async function generateGroundedSummary(question: string, evidence: Evidence[], actions: string[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("AI provider is not configured");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model(), temperature: 0.2, max_tokens: 260, messages: [{ role: "system", content: "Bạn là trợ lý BI có trách nhiệm." }, { role: "user", content: buildGroundedPrompt(question, evidence, actions) }] })
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const payload = await response.json() as ChatCompletion;
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("AI provider returned no content");
    return content;
  } finally { clearTimeout(timeout); }
}

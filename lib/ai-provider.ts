import { setDefaultResultOrder } from "node:dns";
import type { Evidence } from "./types";

type ChatCompletion = { choices?: Array<{ message?: { content?: string } }> };
type ResponseCompletion = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
};

try { setDefaultResultOrder("ipv4first"); } catch { /* Some runtimes do not expose DNS result ordering. */ }

const baseUrl = () => (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const model = () => process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const apiMode = () => process.env.OPENAI_API_MODE === "responses" ? "responses" : "chat";

export function isAiConfigured() { return Boolean(process.env.OPENAI_API_KEY); }

export function buildGroundedPrompt(question: string, evidence: Evidence[], actions: string[]) {
  return [
    "Bạn là Business Intelligence Assistant. Chỉ được kết luận từ EVIDENCE bên dưới.",
    "Trả lời hoàn toàn bằng tiếng Việt, ngắn gọn, tự nhiên và phù hợp với người dùng Việt Nam.",
    "Có thể giữ tên riêng của kênh/chiến dịch/sản phẩm, nhưng nhãn phân tích phải diễn giải bằng tiếng Việt.",
    "Nếu EVIDENCE đã có dữ liệu liên quan đến câu hỏi, không được nói là không có dữ liệu.",
    "Chỉ nêu rõ giới hạn khi EVIDENCE thật sự không đủ.",
    "Không bịa số liệu, không tạo khuyến nghị ngoài danh sách hành động được cung cấp.",
    `CÂU HỎI: ${question}`,
    `EVIDENCE: ${JSON.stringify(evidence)}`,
    `HÀNH ĐỘNG ĐƯỢC PHÉP ĐỀ XUẤT: ${JSON.stringify(actions)}`
  ].join("\n\n");
}

export async function generateGroundedSummary(question: string, evidence: Evidence[], actions: string[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("AI provider is not configured");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const prompt = buildGroundedPrompt(question, evidence, actions);
    const response = await fetch(apiMode() === "responses" ? `${baseUrl()}/responses` : `${baseUrl()}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(apiMode() === "responses"
        ? { model: model(), temperature: 0.2, max_output_tokens: 260, input: [{ role: "system", content: "Bạn là trợ lý BI có trách nhiệm." }, { role: "user", content: prompt }] }
        : { model: model(), temperature: 0.2, max_tokens: 260, messages: [{ role: "system", content: "Bạn là trợ lý BI có trách nhiệm." }, { role: "user", content: prompt }] })
    });
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`AI provider returned ${response.status}${details ? `: ${details.slice(0, 240)}` : ""}`);
    }
    const payload = await response.json() as ChatCompletion & ResponseCompletion;
    const content = payload.choices?.[0]?.message?.content?.trim()
      ?? payload.output_text?.trim()
      ?? payload.output?.flatMap(item => item.content ?? []).map(item => item.text).find(Boolean)?.trim();
    if (!content) throw new Error("AI provider returned no content");
    return content;
  } finally { clearTimeout(timeout); }
}

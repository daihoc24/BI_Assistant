import { NextRequest, NextResponse } from "next/server";
import { fallbackInsight } from "../../../../lib/insight";
import { generateGroundedSummary, isAiConfigured } from "../../../../lib/ai-provider";
import { localizeInsightResponse } from "../../../../lib/localize";
import { allowRequest, askSchema, log, requestId } from "../../../../lib/security";

export async function POST(request: NextRequest) {
  const id = requestId(); const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowRequest(client)) return NextResponse.json({ error: "Bạn đã gửi quá nhiều yêu cầu. Hãy thử lại sau một phút.", requestId: id }, { status: 429 });
  try {
    const body: unknown = await request.json(); const parsed = askSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", requestId: id }, { status: 400 });
    const response = fallbackInsight(parsed.data.question);
    if (isAiConfigured()) {
      try {
        response.answer = await generateGroundedSummary(parsed.data.question, response.evidence, response.actions);
        response.source = "llm";
        response.limitations = undefined;
      } catch (error) { log("warn", "ai_provider_fallback", { requestId: id, error: error instanceof Error ? error.message : "Unknown AI provider error" }); }
    }
    log("info", "assistant_answered", { requestId: id, source: response.source });
    return NextResponse.json(localizeInsightResponse(response), { headers: { "X-Request-ID": id } });
  } catch { log("error", "assistant_failed", { requestId: id }); return NextResponse.json({ error: "Không thể phân tích yêu cầu lúc này. Vui lòng thử lại.", requestId: id }, { status: 500 }); }
}

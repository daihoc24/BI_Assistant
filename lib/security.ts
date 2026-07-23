import { z } from "zod";

const asks = new Map<string, { count: number; reset: number }>();
export const askSchema = z.object({ question: z.string().trim().min(2, "Câu hỏi cần ít nhất 2 ký tự.").max(400, "Câu hỏi tối đa 400 ký tự.").refine((value) => !/[<>]/.test(value), "Câu hỏi không được chứa thẻ HTML.") });
export function allowRequest(key: string) {
  const now = Date.now(); const current = asks.get(key);
  if (!current || current.reset < now) { asks.set(key, { count: 1, reset: now + 60_000 }); return true; }
  if (current.count >= 12) return false; current.count += 1; return true;
}
export function requestId() { return crypto.randomUUID(); }
export function log(level: "info" | "warn" | "error", message: string, context: Record<string, unknown> = {}) { console[level](JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...context })); }

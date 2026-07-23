import { afterEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { aovOf, lineRevenue, revenueOf } from "../lib/analytics";
import { fallbackInsight, normalizeQuestion } from "../lib/insight";
import { buildGroundedPrompt, generateGroundedSummary } from "../lib/ai-provider";
import { getOrders } from "../lib/data/repository";
import { askSchema } from "../lib/security";
import type { Order } from "../lib/types";

describe("analytics", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  afterEach(() => { global.fetch = originalFetch; process.env.OPENAI_API_KEY = originalKey; vi.restoreAllMocks(); });
  it("calculates discount-aware line revenue", () => expect(lineRevenue(2, 100, 0.1)).toBe(180));
  it("returns zero AOV for no completed orders", () => expect(aovOf([])).toBe(0));
  it("preserves non-negative revenue for valid lines", () => fc.assert(fc.property(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 0, max: 1_000_000 }), fc.integer({ min: 0, max: 99 }), (quantity, price, discountPercent) => lineRevenue(quantity, price, discountPercent / 100) >= 0)));
  it("uses the invariant aov * orders = revenue", () => {
    const orders: Order[] = [{ id: "1", date: "2026-01-01", customerId: "c", channel: "Website", status: "completed", lines: [{ productId: "p", product: "P", category: "c", quantity: 2, unitPrice: 100, discount: 0 }] }];
    expect(aovOf(orders) * 1).toBe(revenueOf(orders));
  });
  it("normalizes questions idempotently", () => fc.assert(fc.property(fc.string(), q => normalizeQuestion(normalizeQuestion(q)) === normalizeQuestion(q))));
  it("builds a provider prompt with only supplied evidence and actions", () => {
    const prompt = buildGroundedPrompt("Doanh thu?", [{ metric: "Doanh thu", value: "1 ₫", period: "Tháng 7", explanation: "demo" }], ["Theo dõi kênh"]);
    expect(prompt).toContain("Doanh thu?"); expect(prompt).toContain("Theo dõi kênh"); expect(prompt).toContain("1 ₫");
  });
  it("loads seeded orders from the local repository and excludes cancelled revenue", () => {
    const orders = getOrders();
    expect(orders.length).toBeGreaterThan(0);
    expect(revenueOf(orders)).toBe(revenueOf(orders.filter((order) => order.status === "completed")));
  });
  it("sends only grounded prompt data to an OpenAI-compatible provider", async () => {
    process.env.OPENAI_API_KEY = "test-secret";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "Tóm tắt có căn cứ" } }] }), { status: 200 }));
    global.fetch = fetchMock;
    await expect(generateGroundedSummary("Doanh thu?", [{ metric: "Doanh thu", value: "1 ₫", period: "Tháng 7", explanation: "demo" }], ["Theo dõi kênh"])).resolves.toBe("Tóm tắt có căn cứ");
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.headers).toEqual(expect.objectContaining({ Authorization: "Bearer test-secret" }));
    expect(String(options.body)).toContain("Theo dõi kênh");
  });
  it("fails safely when an AI provider returns no usable content", async () => {
    process.env.OPENAI_API_KEY = "test-secret";
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 }));
    await expect(generateGroundedSummary("Doanh thu?", [], [])).rejects.toThrow("no content");
  });
  it("answers channel weakness questions with channel-specific evidence", () => {
    const response = fallbackInsight("Tai sao social lai thap?");
    expect(response.answer).toContain("Social");
    expect(response.insightType).toBe("Channel diagnostic");
    expect(response.evidence.some(item => item.metric.includes("Social"))).toBe(true);
    expect(response.limitations).toContain("không cần API key");
  });
  it("routes deeper local analytics questions to specialized contexts", () => {
    expect(fallbackInsight("Loi nhuan dong gop dang on khong?").evidence.some(item => item.metric.includes("Contribution profit"))).toBe(true);
    expect(fallbackInsight("Co anomaly nao can xu ly truoc?").evidence.length).toBeGreaterThan(0);
    expect(fallbackInsight("Phan tich nguyen nhan doanh thu do don hay AOV").evidence.some(item => item.metric.includes("Tác động"))).toBe(true);
  });
  it("answers month-over-month revenue percentage directly", () => {
    const response = fallbackInsight("So voi thang truoc doanh thu tang hay giam bao nhieu %?");
    expect(response.insightType).toBe("So sánh với tháng trước");
    expect(response.answer).toContain("%");
    expect(response.evidence.some(item => item.metric.includes("Doanh thu tháng này"))).toBe(true);
  });
  it("supports forecast, scenario, root-cause, and data-quality contexts", () => {
    expect(fallbackInsight("Du bao thang toi ra sao?").evidence.some(item => item.metric.includes("Forecast"))).toBe(true);
    expect(fallbackInsight("What if nao dang thu?").evidence.some(item => item.metric.includes("Shift") || item.metric.includes("Reduce"))).toBe(true);
    expect(fallbackInsight("Root cause chinh la gi?").evidence.some(item => item.metric.includes("#1"))).toBe(true);
    expect(fallbackInsight("Data quality co on khong?").evidence.some(item => item.metric.includes("Customer join"))).toBe(true);
  });
  it("supports 360 review, comparison, decision support, and follow-up prompts", () => {
    expect(fallbackInsight("Phan tich sau suc khoe kinh doanh").insightType).toBe("360 business review");
    expect(fallbackInsight("So sanh best worst").insightType).toBe("Best versus worst comparison");
    expect(fallbackInsight("Co nen scale kenh nao khong?").insightType).toBe("Decision support");
    expect(fallbackInsight("Phan tich sau suc khoe kinh doanh").followUps?.length).toBeGreaterThan(0);
  });
  it("supports the broader Vietnamese business question set", () => {
    expect(fallbackInsight("Nếu là CEO, tôi nên quan tâm điều gì trong báo cáo này?").insightType).toBe("Báo cáo điều hành");
    expect(fallbackInsight("Danh mục nào tạo ra nhiều doanh thu nhất?").insightType).toBe("Phân tích danh mục sản phẩm");
    expect(fallbackInsight("Campaign nào nên dừng?").insightType).toBe("Tư vấn ngân sách marketing");
    expect(fallbackInsight("Hãy giải thích dữ liệu này cho một người không chuyên.").insightType).toBe("Giải thích dễ hiểu");
    expect(fallbackInsight("Hãy tìm correlation giữa sản phẩm và nhóm khách hàng.").insightType).toBe("Tương quan sản phẩm và khách hàng");
  });
  it("routes revenue trend, growth, and customer questions without confusing bao nhieu", () => {
    expect(fallbackInsight("Doanh thu tháng nào cao nhất?").insightType).toBe("Xu hướng doanh thu");
    expect(fallbackInsight("Nếu muốn tăng doanh thu 20%, tôi nên tập trung vào đâu?").insightType).toBe("Kế hoạch tăng trưởng doanh thu");
    expect(fallbackInsight("Khách hàng VIP đóng góp bao nhiêu % doanh thu?").insightType).toBe("Customer segment analysis");
  });
  it("supports CEO-level advanced analytics from the expanded question bank", () => {
    expect(fallbackInsight("Hãy phân tích nguyên nhân doanh thu giảm theo từng cấp độ.").insightType).toBe("Phân tích nguyên nhân nhiều tầng");
    expect(fallbackInsight("Campaign nào hoạt động kém hơn trung bình?").insightType).toBe("So sánh và benchmark");
    expect(fallbackInsight("Ai là 10 khách hàng có giá trị nhất?").insightType).toBe("Customer intelligence");
    expect(fallbackInsight("Có dấu hiệu khách hàng rời bỏ không?").insightType).toBe("Customer churn");
    expect(fallbackInsight("Tại sao conversion rate giảm?").insightType).toBe("Tối ưu bán hàng");
    expect(fallbackInsight("Sản phẩm nào cần nhập thêm?").insightType).toBe("Quản trị tồn kho và sản phẩm");
    expect(fallbackInsight("Hãy đưa ra kế hoạch tăng trưởng 90 ngày.").insightType).toBe("Chiến lược kinh doanh");
    expect(fallbackInsight("Dự đoán doanh thu tháng sau.").insightType).toBe("Dự báo và dự đoán");
    expect(fallbackInsight("Nếu tăng giá sản phẩm 10% thì sao?").insightType).toBe("Phân tích kịch bản what-if");
  });
  it("rejects HTML-like question input before processing", () => {
    expect(askSchema.safeParse({ question: "<script>alert(1)</script>" }).success).toBe(false);
    expect(askSchema.safeParse({ question: "Doanh thu thay đổi thế nào?" }).success).toBe(true);
  });
});

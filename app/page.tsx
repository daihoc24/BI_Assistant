"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { DashboardResponse, InsightResponse, Kpi } from "../lib/types";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const insightPrompts = [
  "Tháng này bán ổn không?",
  "Nếu là CEO, tôi nên quan tâm điều gì?",
  "Doanh thu giảm do đơn hay AOV?",
  "Sản phẩm nào nên quảng cáo?",
  "Chiến dịch nào nên dừng?",
  "Khách hàng nào nên chăm sóc?",
  "Ai là 10 khách hàng giá trị nhất?",
  "Nếu tăng giá sản phẩm 10% thì sao?",
  "Kế hoạch tăng trưởng 90 ngày?"
];

const channelLabels = {
  Website: "Website",
  Marketplace: "Sàn TMĐT",
  Social: "Mạng xã hội",
  Email: "Email",
  Affiliate: "Tiếp thị liên kết"
} as const;

const segmentLabels = {
  New: "Khách mới",
  Returning: "Khách quay lại",
  VIP: "Khách VIP",
  "At Risk": "Có nguy cơ rời bỏ"
} as const;

const riskLabels = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao"
} as const;

const campaignLabels = {
  "Search Always On": "Tìm kiếm thường xuyên",
  "Marketplace Mega Day": "Siêu sale sàn TMĐT",
  "Social Short Video": "Video ngắn mạng xã hội",
  "VIP Email Drop": "Email ưu đãi VIP",
  "Creator Affiliate Push": "Đẩy bán qua creator"
} as const;

const insightTypeLabels: Record<string, string> = {
  "Channel diagnostic": "Chẩn đoán kênh bán",
  "Product and operations risk": "Rủi ro sản phẩm và vận hành",
  "Customer segment analysis": "Phân tích phân khúc khách hàng",
  "Campaign efficiency": "Hiệu quả chiến dịch",
  "Revenue health": "Sức khỏe doanh thu",
  "Anomaly scan": "Quét tín hiệu bất thường",
  "Contribution profit": "Lợi nhuận đóng góp",
  "Cohort and retention": "Cohort và giữ chân khách hàng",
  "Executive recommendation": "Đề xuất điều hành",
  "Forecast": "Dự báo doanh thu",
  "What-if scenario": "Kịch bản giả định",
  "Root cause ranking": "Xếp hạng nguyên nhân gốc",
  "Data quality": "Chất lượng dữ liệu",
  "360 business review": "Tổng quan kinh doanh 360",
  "Best versus worst comparison": "So sánh tốt và yếu",
  "Decision support": "Hỗ trợ ra quyết định",
  "Customer intelligence": "Phân tích khách hàng",
  "Customer churn": "Nguy cơ khách hàng rời bỏ",
  "Phân tích kịch bản what-if": "Phân tích kịch bản giả định"
};

function displayChannel(name: string) {
  return channelLabels[name as keyof typeof channelLabels] ?? name;
}

function displaySegment(name: string) {
  return segmentLabels[name as keyof typeof segmentLabels] ?? name;
}

function displayRisk(name: string) {
  return riskLabels[name as keyof typeof riskLabels] ?? name;
}

function displayCampaign(name: string) {
  return campaignLabels[name as keyof typeof campaignLabels] ?? name;
}

function displayInsightType(name: string) {
  return insightTypeLabels[name] ?? name;
}

type ConversationItem = { question: string; response: InsightResponse };

function KpiCard({ kpi }: { kpi: Kpi }) {
  const value = kpi.format === "currency" ? money.format(kpi.value) : kpi.value.toLocaleString("vi-VN");
  const changeText = kpi.change === null ? "Chưa có kỳ trước" : `${kpi.change > 0 ? "+" : ""}${kpi.change.toFixed(1)}% so với kỳ trước`;

  return (
    <article className="card kpi">
      <span>{kpi.label}</span>
      <strong>{value}</strong>
      <small className={kpi.change !== null && kpi.change < 0 ? "down" : "up"}>{changeText}</small>
    </article>
  );
}

function ChatExchange({ item, onFollowUp, disabled }: { item: ConversationItem; onFollowUp: (question: string) => void; disabled: boolean }) {
  const { response } = item;

  return (
    <div className="chat-exchange">
      <div className="message-row user-row">
        <div className="message-bubble user-bubble">{item.question}</div>
      </div>
      <div className="message-row assistant-row">
        <div className="assistant-avatar">IP</div>
        <div className="message-bubble assistant-bubble">
          <div className="message-meta">
            <span>InsightPilot</span>
            <span>{response.source === "fallback" ? "Phân tích nội bộ" : "AI trực tiếp"}</span>
          </div>
          {response.insightType && <div className="insight-type">{displayInsightType(response.insightType)}</div>}
          <p>{response.answer}</p>
          <div className="insight-grid">
            <section>
              <h3>Bằng chứng</h3>
              {response.evidence.map((e, index) => (
                <div className="evidence" key={`${e.metric}-${index}`}>
                  <strong>{e.metric}: {e.value}</strong>
                  <small>{e.period} · {e.explanation}</small>
                </div>
              ))}
            </section>
            <section>
              <h3>Đề xuất</h3>
              <ul>
                {response.actions.map((action, index) => (
                  <li key={`${action}-${index}`}>{action}</li>
                ))}
              </ul>
            </section>
          </div>
          {response.limitations && <div className="limitation">{response.limitations}</div>}
          {response.followUps && response.followUps.length > 0 && (
            <div className="follow-ups">
              <h3>Câu hỏi tiếp theo</h3>
              {response.followUps.map(question => (
                <button key={question} onClick={() => onFollowUp(question)} disabled={disabled}>{question}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [asking, setAsking] = useState(false);

  const load = () => {
    fetch("/api/dashboard")
      .then(async response => (response.ok ? response.json() : Promise.reject(new Error("Không thể tải dữ liệu dashboard."))))
      .then(setDashboard)
      .catch(cause => setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu dashboard."));
  };

  useEffect(load, []);

  const maxRevenue = useMemo(() => Math.max(...(dashboard?.trend.map(x => x.revenue) ?? [1])), [dashboard]);

  async function ask(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset ?? question).trim();
    if (!text) return;

    setAsking(true);
    setError("");

    try {
      const response = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setHistory(items => [...items, { question: text, response: body }]);
      setQuestion("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể nhận phản hồi AI.");
    } finally {
      setAsking(false);
    }
  }

  if (!dashboard && !error) return <main className="loading">Đang tải InsightPilot...</main>;

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">TRỢ LÝ PHÂN TÍCH KINH DOANH</p>
          <h1>InsightPilot</h1>
          <p>Biến dữ liệu bán lẻ thành quyết định có căn cứ.</p>
        </div>
        <span className="badge">Chế độ demo · Không cần API key</span>
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
          <button onClick={() => { setError(""); load(); }} data-testid="dashboard-retry-button">Thử lại</button>
        </div>
      )}

      {dashboard && (
        <>
          <section className="section-title">
            <div>
              <h2>Sức khỏe kinh doanh</h2>
              <p>{dashboard.periodLabel}</p>
            </div>
            <button className="text-button" onClick={() => { setError(""); load(); }} data-testid="dashboard-refresh-button">Làm mới</button>
          </section>

          <section className="kpi-grid">{dashboard.kpis.map(kpi => <KpiCard key={kpi.label} kpi={kpi} />)}</section>

          <section className="grid-two">
            <article className="panel">
              <h2>Xu hướng doanh thu</h2>
              <div className="bars" aria-label="Biểu đồ doanh thu theo tháng">
                {dashboard.trend.map(item => (
                  <div className="bar-wrap" key={item.label}>
                    <div className="bar" style={{ height: `${Math.max(14, item.revenue / maxRevenue * 170)}px` }} />
                    <strong>{money.format(item.revenue)}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel">
              <h2>Hiệu quả kênh bán</h2>
              {dashboard.channelDiagnostics.map(item => (
                <div className="row diagnostic-row" key={item.name}>
                  <span>{displayChannel(item.name)}<small>Chuyển đổi {(item.conversionRate * 100).toFixed(2)}% · Chi phí/đơn {money.format(item.cac)}</small></span>
                  <strong>{money.format(item.revenue)}</strong>
                </div>
              ))}
            </article>
          </section>

          <section className="grid-two">
            <article className="panel">
              <h2>Sản phẩm dẫn đầu</h2>
              {dashboard.productRisks.slice(0, 5).map((item, index) => (
                <div className="row" key={item.name}>
                  <span><em>0{index + 1}</em>{item.name}<small>Tồn {item.stock} · Trả hàng {(item.returnRate * 100).toFixed(1)}% · Rủi ro {displayRisk(item.risk)}</small></span>
                  <strong>{money.format(item.revenue)}</strong>
                </div>
              ))}
              <h2 className="subpanel-title">Danh mục nổi bật</h2>
              {dashboard.categories.slice(0, 3).map(item => (
                <div className="row" key={item.name}>
                  <span>{item.name}</span>
                  <strong>{money.format(item.revenue)}</strong>
                </div>
              ))}
            </article>

            <article className="assistant">
              <div className="assistant-heading">
                <div>
                  <p className="eyebrow">HỎI INSIGHTPILOT</p>
                  <h2>Trợ lý phân tích dữ liệu</h2>
                  <p>Hỏi doanh thu, kênh bán, chiến dịch, tồn kho, phân khúc khách hàng và nhận câu trả lời có bằng chứng.</p>
                </div>
                {history.length > 0 && (
                  <button className="clear-history" onClick={() => setHistory([])} data-testid="assistant-clear-history-button">Xóa</button>
                )}
              </div>

              <div className="chat-window">
                {history.length === 0 ? (
                  <div className="empty-chat">
                    <div className="assistant-avatar">IP</div>
                    <div>
                      <strong>Xin chào, mình là InsightPilot.</strong>
                      <p>Chọn một câu hỏi gợi ý hoặc nhập câu hỏi kinh doanh của bạn.</p>
                    </div>
                  </div>
                ) : (
                  history.map((item, index) => <ChatExchange item={item} onFollowUp={(nextQuestion) => ask(undefined, nextQuestion)} disabled={asking} key={`${item.question}-${index}`} />)
                )}
                {asking && (
                  <div className="message-row assistant-row">
                    <div className="assistant-avatar">IP</div>
                    <div className="message-bubble assistant-bubble typing">Đang phân tích dữ liệu...</div>
                  </div>
                )}
              </div>

              <div className="chips">
                {insightPrompts.map(item => (
                  <button key={item} onClick={() => ask(undefined, item)} disabled={asking} data-testid="assistant-suggested-question">{item}</button>
                ))}
              </div>

              <form className="composer" onSubmit={ask}>
                <textarea
                  aria-label="Câu hỏi của bạn"
                  value={question}
                  onChange={event => setQuestion(event.target.value)}
                  maxLength={400}
                  placeholder="Hỏi InsightPilot..."
                  data-testid="assistant-question-input"
                />
                <button disabled={asking} data-testid="assistant-submit-button">{asking ? "..." : "Gửi"}</button>
              </form>
            </article>
          </section>

          <section className="grid-two">
            <article className="panel">
              <h2>Phân khúc khách hàng</h2>
              {dashboard.segmentDiagnostics.map(item => (
                <div className="row diagnostic-row" key={item.name}>
                  <span>{displaySegment(item.name)}<small>{item.customers} khách · Giá trị đơn TB {money.format(item.aov)} · Trả hàng {(item.returnRate * 100).toFixed(1)}%</small></span>
                  <strong>{money.format(item.revenue)}</strong>
                </div>
              ))}
            </article>
            <article className="panel">
              <h2>Hiệu quả chiến dịch</h2>
              {dashboard.campaignDiagnostics.map(item => (
                <div className="row diagnostic-row" key={item.name}>
                  <span>{displayCampaign(item.name)}<small>{displayChannel(item.channel)} · Chi phí/click {money.format(item.cpc)} · Hiệu quả quảng cáo {item.roas.toFixed(2)}x</small></span>
                  <strong>{money.format(item.attributedRevenue)}</strong>
                </div>
              ))}
            </article>
          </section>

        </>
      )}
    </main>
  );
}

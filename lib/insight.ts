import { getDashboard } from "./analytics";
import { demoCustomers } from "./data/seed";
import { getOrders } from "./data/repository";
import type { ChannelDiagnostic, Evidence, InsightResponse } from "./types";

type Confidence = "Cao" | "Trung bình" | "Cần thêm dữ liệu";
type InsightContext = { type: string; summary: string; evidence: Evidence[]; actions: string[]; confidence: Confidence; followUps: string[] };

const formatMoney = (value: number) => `${Math.round(value).toLocaleString("vi-VN")} ₫`;
const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

export function normalizeQuestion(question: string) {
  return question
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ");
}

function evidence(metric: string, value: string, explanation: string): Evidence {
  return { metric, value, period: getDashboard().periodLabel, explanation };
}

function findChannel(question: string, channels: ChannelDiagnostic[]) {
  const normalized = normalizeQuestion(question);
  if (normalized.includes("facebook")) return channels.find(channel => channel.name === "Social");
  return channels.find(channel => normalized.includes(normalizeQuestion(channel.name)));
}

function customerRevenueRows() {
  const rows = new Map<string, { id: string; segment: string; revenue: number; orders: number; lifetimeValue: number; lastOrderDate: string }>();
  getOrders()
    .filter(order => order.status === "completed")
    .forEach(order => {
      const customer = demoCustomers.find(item => item.id === order.customerId);
      const old = rows.get(order.customerId) ?? {
        id: order.customerId,
        segment: customer?.segment ?? "Unknown",
        revenue: 0,
        orders: 0,
        lifetimeValue: customer?.lifetimeValue ?? 0,
        lastOrderDate: order.date
      };
      const orderRevenue = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (1 - line.discount), 0);
      old.revenue += orderRevenue;
      old.orders += 1;
      old.lastOrderDate = order.date > old.lastOrderDate ? order.date : old.lastOrderDate;
      rows.set(order.customerId, old);
    });
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
}

function channelContext(question: string): InsightContext | null {
  const dashboard = getDashboard();
  const normalized = normalizeQuestion(question);
  const channels = dashboard.channelDiagnostics;
  const topRevenue = channels[0];
  const worstConversion = [...channels].sort((a, b) => a.conversionRate - b.conversionRate)[0];
  const highestCac = [...channels].sort((a, b) => b.cac - a.cac)[0];
  const mentioned = findChannel(question, channels);
  const target = mentioned ?? (normalized.includes("thap") || normalized.includes("yeu") ? worstConversion : topRevenue);
  if (!normalized.includes("kenh") && !normalized.includes("channel") && !mentioned) return null;

  return {
    type: "Channel diagnostic",
    summary: `${target.name} cần được đọc qua cả doanh thu, conversion, CAC và AOV. Nếu chỉ nhìn doanh thu, ta dễ bỏ sót kênh có traffic cao nhưng chuyển đổi thấp hoặc chi phí mua đơn cao.`,
    evidence: [
      evidence(`Doanh thu ${target.name}`, formatMoney(target.revenue), `${target.orders} dòng đơn, chiếm ${(target.revenueShare * 100).toFixed(1)}% doanh thu`),
      evidence(`Conversion ${target.name}`, formatPercent(target.conversionRate), `${target.traffic.toLocaleString("vi-VN")} traffic, CAC ${formatMoney(target.cac)}, AOV ${formatMoney(target.aov)}`),
      evidence("Kênh doanh thu cao nhất", `${topRevenue.name}: ${formatMoney(topRevenue.revenue)}`, `Conversion ${formatPercent(topRevenue.conversionRate)}, CAC ${formatMoney(topRevenue.cac)}`),
      evidence("Kênh CAC cao nhất", `${highestCac.name}: ${formatMoney(highestCac.cac)}`, `Spend ${formatMoney(highestCac.spend)}, traffic ${highestCac.traffic.toLocaleString("vi-VN")}`)
    ],
    actions: [
      `Kiểm tra landing page, offer và creative của ${target.name} vì conversion/CAC là tín hiệu cần soi kỹ.`,
      `So sánh thông điệp bán hàng của ${target.name} với ${topRevenue.name} trước khi tăng ngân sách.`,
      `Chạy A/B test nhỏ cho ${target.name}, đo conversion rate và CAC trước khi scale.`
    ],
    confidence: "Trung bình",
    followUps: [`Campaign nào ảnh hưởng ${target.name}?`, `${target.name} có nên scale không?`, `So sánh ${target.name} với kênh tốt nhất`]
  };
}

function productContext(): InsightContext {
  const dashboard = getDashboard();
  const topProducts = dashboard.productRisks.slice(0, 3);
  return {
    type: "Product and operations risk",
    summary: "Góc nhìn sản phẩm phải nối doanh thu với tồn kho và return rate. Sản phẩm doanh thu cao nhưng tồn thấp hoặc return cao là rủi ro vận hành, không chỉ là cơ hội bán thêm.",
    evidence: topProducts.map(product => evidence(`Sản phẩm ${product.name}`, formatMoney(product.revenue), `${product.orders} dòng đơn, tồn ${product.stock}, return ${formatPercent(product.returnRate)}, risk ${product.risk}`)),
    actions: [
      `Ưu tiên tồn kho và kiểm tra return reason cho ${topProducts[0].name}.`,
      "Tạo bundle giữa sản phẩm top và sản phẩm giá thấp để tăng AOV.",
      "Kiểm tra sản phẩm doanh thu cao nhưng ít đơn để tối ưu giá và thông điệp."
    ],
    confidence: "Cao",
    followUps: ["Sản phẩm nào nên nhập thêm?", "Return rate cao vì sao?", "Sản phẩm nào nên bundle để tăng AOV?"]
  };
}

function customerContext(): InsightContext {
  const dashboard = getDashboard();
  const topSegments = dashboard.segmentDiagnostics.slice(0, 3);
  return {
    type: "Customer segment analysis",
    summary: "Phân khúc khách hàng cho biết doanh thu đến từ nhóm nào và chất lượng đơn hàng ra sao. AOV cao nhưng return rate cao có thể làm lợi nhuận thực tế yếu hơn doanh thu hiển thị.",
    evidence: topSegments.map(segment => evidence(`Phân khúc ${segment.name}`, formatMoney(segment.revenue), `${segment.customers} khách, AOV ${formatMoney(segment.aov)}, return ${formatPercent(segment.returnRate)}`)),
    actions: [
      `Thiết kế offer riêng cho ${topSegments[0].name} vì đây là nhóm đóng góp doanh thu cao nhất.`,
      "Tách retention campaign cho Returning/VIP khỏi acquisition campaign cho New.",
      "Theo dõi return rate theo phân khúc để tránh tăng doanh thu nhưng giảm lợi nhuận."
    ],
    confidence: "Trung bình",
    followUps: ["Cohort nào giữ chân kém?", "VIP có đáng ưu tiên không?", "Segment nào return cao nhất?"]
  };
}

function campaignContext(question: string): InsightContext {
  const dashboard = getDashboard();
  const normalized = normalizeQuestion(question);
  const campaigns = dashboard.campaignDiagnostics;
  const worstRoas = [...campaigns].sort((a, b) => a.roas - b.roas)[0];
  const bestRoas = campaigns[0];
  const mentionedChannel = dashboard.channelDiagnostics.find(channel => normalized.includes(normalizeQuestion(channel.name)));
  const asksForBest = normalized.includes("tot") || normalized.includes("hieu qua") || normalized.includes("dang chay") || normalized.includes("nen tang") || normalized.includes("scale");
  const target = mentionedChannel ? campaigns.find(campaign => campaign.channel === mentionedChannel.name) ?? bestRoas : asksForBest ? bestRoas : worstRoas;
  return {
    type: "Hiệu quả chiến dịch",
    summary: asksForBest
      ? `${target.name} đang là chiến dịch chạy tốt nhất theo ROAS hiện tại. Vẫn nên đọc cùng CPC, doanh thu gán kênh và hiệu quả chuyển đổi trước khi tăng ngân sách.`
      : "Chiến dịch cần được đánh giá bằng ROAS, CPC, CAC và tác động kênh. Doanh thu cao chưa chắc tốt nếu chi phí quảng cáo đang ăn hết hiệu quả.",
    evidence: [
      evidence(`${asksForBest ? "Chiến dịch đang chạy tốt" : "Chiến dịch cần soi"}: ${target.name}`, `${target.roas.toFixed(2)}x ROAS`, `${target.channel}, chi phí ${formatMoney(target.spend)}, CPC ${formatMoney(target.cpc)}`),
      evidence("Chiến dịch hiệu quả nhất", `${bestRoas.name}: ${bestRoas.roas.toFixed(2)}x ROAS`, `${bestRoas.channel}, doanh thu gán kênh ${formatMoney(bestRoas.attributedRevenue)}`),
      ...dashboard.channelDiagnostics
        .filter(channel => !mentionedChannel || channel.name === mentionedChannel.name)
        .slice(0, 2)
        .map(channel => evidence(`Kênh ${channel.name}`, formatMoney(channel.revenue), `CR ${formatPercent(channel.conversionRate)}, CAC ${formatMoney(channel.cac)}, AOV ${formatMoney(channel.aov)}`))
    ],
    actions: asksForBest
      ? [
        `Tăng thử ngân sách nhỏ cho ${target.name} nếu ROAS và CAC vẫn ổn định.`,
        `Dùng offer/creative của ${target.name} làm chuẩn so sánh cho chiến dịch yếu hơn.`,
        "Theo dõi ROAS, CAC và contribution profit sau khi tăng ngân sách."
      ]
      : [
        `Giảm scale của ${target.name} cho đến khi CPC/CAC cải thiện.`,
        `Mượn creative hoặc offer từ ${bestRoas.name} để test lại kênh yếu.`,
        "Đánh giá chiến dịch bằng ROAS và CAC, không chỉ doanh thu."
      ],
    confidence: "Trung bình",
    followUps: ["Chiến dịch nào nên giảm ngân sách?", "Có nên chuyển ngân sách không?", "Chiến dịch nào có ROAS tốt nhất?"]
  };
}

function revenueContext(): InsightContext {
  const dashboard = getDashboard();
  const revenue = dashboard.kpis[0];
  const orders = dashboard.kpis[1];
  const aov = dashboard.kpis[2];
  const recentTrend = dashboard.trend.slice(-3).map(point => evidence(`Xu hướng ${point.label}`, formatMoney(point.revenue), `${point.orders} đơn hoàn tất`));
  return {
    type: "Revenue health",
    summary: "Doanh thu kỳ này nên được tách thành ba driver chính: số đơn hàng, AOV và xu hướng theo tháng. Sau đó mới nối tiếp sang mix kênh, sản phẩm, campaign và phân khúc khách hàng.",
    evidence: [
      evidence("Doanh thu kỳ hiện tại", formatMoney(revenue.value), `${revenue.change?.toFixed(1) ?? "N/A"}% so với kỳ trước`),
      evidence("Số đơn hàng", orders.value.toLocaleString("vi-VN"), `${orders.change?.toFixed(1) ?? "N/A"}% so với kỳ trước`),
      evidence("AOV", formatMoney(aov.value), `${aov.change?.toFixed(1) ?? "N/A"}% so với kỳ trước`),
      ...recentTrend
    ],
    actions: [
      "Tách tác động giữa số đơn và AOV trước khi kết luận doanh thu tăng/giảm.",
      "Ưu tiên kênh có CAC thấp và conversion ổn định.",
      "Theo dõi sản phẩm top để tránh thiếu hàng trong kỳ tiếp theo."
    ],
    confidence: "Cao",
    followUps: ["Root cause chính là gì?", "Kênh nào kéo doanh thu xuống?", "Dự báo tháng tới ra sao?"]
  };
}

function revenueTrendContext(): InsightContext {
  const dashboard = getDashboard();
  const trend = dashboard.trend;
  const bestMonth = [...trend].sort((a, b) => b.revenue - a.revenue)[0];
  const worstMonth = [...trend].sort((a, b) => a.revenue - b.revenue)[0];
  const averageRevenue = trend.reduce((sum, point) => sum + point.revenue, 0) / Math.max(trend.length, 1);
  const first = trend[0];
  const last = trend[trend.length - 1];
  const growth = first.revenue === 0 ? 0 : ((last.revenue - first.revenue) / first.revenue) * 100;
  return {
    type: "Xu hướng doanh thu",
    summary: `Trong 6 tháng gần đây, tháng doanh thu cao nhất là ${bestMonth.label} với ${formatMoney(bestMonth.revenue)}, thấp nhất là ${worstMonth.label} với ${formatMoney(worstMonth.revenue)}. Doanh thu trung bình mỗi tháng khoảng ${formatMoney(averageRevenue)}. Từ ${first.label} đến ${last.label}, tốc độ thay đổi là ${growth.toFixed(1)}%.`,
    evidence: [
      evidence("Tháng doanh thu cao nhất", formatMoney(bestMonth.revenue), `${bestMonth.label}, ${bestMonth.orders} đơn`),
      evidence("Tháng doanh thu thấp nhất", formatMoney(worstMonth.revenue), `${worstMonth.label}, ${worstMonth.orders} đơn`),
      evidence("Doanh thu trung bình tháng", formatMoney(averageRevenue), `Tính trên ${trend.length} tháng gần nhất`),
      evidence("Tăng trưởng 6 tháng", `${growth.toFixed(1)}%`, `${first.label}: ${formatMoney(first.revenue)} → ${last.label}: ${formatMoney(last.revenue)}`)
    ],
    actions: [
      "So sánh tháng tốt nhất với tháng hiện tại để tìm khác biệt về đơn hàng, kênh và campaign.",
      "Nếu xu hướng giảm, ưu tiên kiểm tra số đơn trước, sau đó mới kiểm tra AOV.",
      "Dùng forecast cùng root cause để tránh chỉ nhìn đường trend mà bỏ qua nguyên nhân."
    ],
    confidence: "Cao",
    followUps: ["Vì sao doanh thu tháng này giảm?", "Dự đoán doanh thu tháng tiếp theo?", "Nếu muốn tăng doanh thu 20% thì tập trung vào đâu?"]
  };
}

function growthPlanContext(): InsightContext {
  const dashboard = getDashboard();
  const revenue = dashboard.kpis[0];
  const target = revenue.value * 1.2;
  const gap = target - revenue.value;
  const bestChannel = [...dashboard.channelDiagnostics].sort((a, b) => b.revenue - a.revenue)[0];
  const bestProduct = dashboard.productRisks[0];
  const bestSegment = dashboard.segmentDiagnostics[0];
  return {
    type: "Kế hoạch tăng trưởng doanh thu",
    summary: `Nếu muốn tăng doanh thu 20%, mục tiêu cần đạt là khoảng ${formatMoney(target)}, tức cần thêm ${formatMoney(gap)} so với hiện tại. Nên tập trung vào 3 đòn bẩy: tăng đơn từ kênh ${bestChannel.name}, đẩy sản phẩm ${bestProduct.name}, và chăm sóc nhóm khách ${bestSegment.name}.`,
    evidence: [
      evidence("Doanh thu hiện tại", formatMoney(revenue.value), `Mục tiêu +20% là ${formatMoney(target)}`),
      evidence(`Kênh ưu tiên: ${bestChannel.name}`, formatMoney(bestChannel.revenue), `CR ${formatPercent(bestChannel.conversionRate)}, CAC ${formatMoney(bestChannel.cac)}`),
      evidence(`Sản phẩm ưu tiên: ${bestProduct.name}`, formatMoney(bestProduct.revenue), `${bestProduct.orders} dòng đơn, risk ${bestProduct.risk}`),
      evidence(`Nhóm khách ưu tiên: ${bestSegment.name}`, formatMoney(bestSegment.revenue), `${bestSegment.customers} khách, AOV ${formatMoney(bestSegment.aov)}`)
    ],
    actions: [
      `Tăng thử ngân sách cho ${bestChannel.name} nếu CAC vẫn nằm trong ngưỡng chấp nhận.`,
      `Chạy bundle/upsell quanh ${bestProduct.name} để vừa tăng đơn vừa tăng AOV.`,
      `Tạo ưu đãi giữ chân hoặc mua lại cho nhóm ${bestSegment.name}.`
    ],
    confidence: "Trung bình",
    followUps: ["Nếu có thêm 100 triệu ngân sách thì phân bổ thế nào?", "Sản phẩm nào nên quảng cáo?", "Kênh nào nên tăng ngân sách?"]
  };
}

function monthComparisonContext(): InsightContext {
  const dashboard = getDashboard();
  const revenue = dashboard.kpis[0];
  const orders = dashboard.kpis[1];
  const aov = dashboard.kpis[2];
  const changeText = revenue.change === null ? "chưa đủ dữ liệu để so sánh" : `${revenue.change > 0 ? "tăng" : "giảm"} ${Math.abs(revenue.change).toFixed(1)}%`;
  return {
    type: "So sánh với tháng trước",
    summary: `So với tháng trước, doanh thu đang ${changeText}. Doanh thu hiện tại là ${formatMoney(revenue.value)}, tháng trước là ${formatMoney(revenue.previous)}.`,
    evidence: [
      evidence("Doanh thu tháng này", formatMoney(revenue.value), revenue.change === null ? "Chưa có kỳ trước" : `So với tháng trước: ${revenue.change.toFixed(1)}%`),
      evidence("Doanh thu tháng trước", formatMoney(revenue.previous), "Mốc so sánh gần nhất"),
      evidence("Số đơn hàng", orders.value.toLocaleString("vi-VN"), `Tháng trước ${orders.previous.toLocaleString("vi-VN")}, thay đổi ${orders.change?.toFixed(1) ?? "N/A"}%`),
      evidence("Giá trị đơn trung bình", formatMoney(aov.value), `Tháng trước ${formatMoney(aov.previous)}, thay đổi ${aov.change?.toFixed(1) ?? "N/A"}%`)
    ],
    actions: [
      "Nếu muốn biết vì sao thay đổi, hãy xem tiếp phần số đơn và giá trị đơn trung bình.",
      "Ưu tiên kiểm tra kênh có số đơn giảm mạnh trước.",
      "So sánh thêm campaign để biết thay đổi có đến từ ngân sách marketing không."
    ],
    confidence: "Cao",
    followUps: ["Vì sao doanh thu thay đổi?", "Doanh thu giảm do đơn hay AOV?", "Kênh nào kéo doanh thu xuống?"]
  };
}

function driverContext(): InsightContext {
  const dashboard = getDashboard();
  const drivers = dashboard.revenueDrivers;
  return {
    type: "Phân tích nguyên nhân doanh thu",
    summary: "Biến động doanh thu được tách thành hai nguyên nhân chính: số đơn hàng và giá trị đơn trung bình. Cách này giúp biết doanh thu đổi vì bán ít đơn hơn hay vì mỗi đơn có giá trị thấp hơn.",
    evidence: drivers.map(driver => evidence(driver.name === "Orders" ? "Tác động từ số đơn hàng" : "Tác động từ giá trị đơn trung bình", `${Math.round(driver.impact).toLocaleString("vi-VN")} ₫`, `Hiện tại ${Math.round(driver.current).toLocaleString("vi-VN")}, tháng trước ${Math.round(driver.previous).toLocaleString("vi-VN")}, chênh lệch ${Math.round(driver.change).toLocaleString("vi-VN")}`)),
    actions: [
      drivers[0].name === "Orders" ? "Ưu tiên khôi phục volume đơn hàng qua kênh có CAC thấp." : "Ưu tiên tăng AOV bằng bundle, threshold freeship hoặc upsell.",
      "Đọc driver cùng channel mix để tránh tối ưu sai nguyên nhân.",
      "Theo dõi lại sau mỗi chiến dịch vì driver có thể đổi theo tuần."
    ],
    confidence: "Cao",
    followUps: ["Nếu muốn tăng AOV thì làm gì?", "Volume đơn giảm ở kênh nào?", "Driver này ảnh hưởng profit thế nào?"]
  };
}

function anomalyContext(): InsightContext {
  const dashboard = getDashboard();
  return {
    type: "Anomaly scan",
    summary: "Anomaly scan tìm các tín hiệu bất thường nổi bật trên kênh, campaign, sản phẩm và profit. Đây là lớp cảnh báo để biết nên soi đâu trước.",
    evidence: dashboard.anomalies.map(item => evidence(`${item.severity} - ${item.area}`, item.signal, item.recommendation)),
    actions: dashboard.recommendations.slice(0, 3).map(item => `${item.priority}: ${item.action}`),
    confidence: dashboard.anomalies.length > 0 ? "Trung bình" : "Cần thêm dữ liệu",
    followUps: ["Anomaly nào ảnh hưởng profit?", "Root cause của anomaly là gì?", "Nên xử lý anomaly nào trước?"]
  };
}

function profitContext(): InsightContext {
  const dashboard = getDashboard();
  const profit = dashboard.profit;
  return {
    type: "Contribution profit",
    summary: "Profit view ước tính lợi nhuận đóng góp bằng cách nối doanh thu, marketing spend và return cost. Điều này tránh ảo giác doanh thu cao nhưng lợi nhuận xấu.",
    evidence: [
      evidence("Gross revenue", formatMoney(profit.grossRevenue), "Doanh thu trước khi trừ spend và return cost"),
      evidence("Marketing spend", formatMoney(profit.marketingSpend), "Tổng spend campaign trong kỳ"),
      evidence("Return cost", formatMoney(profit.returnCost), "Chi phí trả hàng ghi nhận trong kỳ"),
      evidence("Contribution profit", formatMoney(profit.contributionProfit), `Margin ${(profit.marginRate * 100).toFixed(1)}%`)
    ],
    actions: [
      profit.marginRate < 0 ? "Dừng scale campaign ROAS thấp trước khi tăng doanh thu." : "Có thể scale chọn lọc kênh ROAS cao.",
      "Giảm return cost ở sản phẩm risk cao.",
      "Theo dõi contribution profit như KPI phụ bên cạnh revenue."
    ],
    confidence: "Trung bình",
    followUps: ["Cắt spend ở đâu trước?", "Return cost đến từ sản phẩm nào?", "Có nên scale kênh ROAS cao không?"]
  };
}

function cohortContext(): InsightContext {
  const dashboard = getDashboard();
  return {
    type: "Cohort and retention",
    summary: "Cohort view xem chất lượng khách hàng theo segment: repeat rate, LTV và risk. Đây là góc nhìn rộng hơn customer revenue snapshot.",
    evidence: dashboard.cohorts.map(cohort => evidence(`Cohort ${cohort.segment}`, `${Math.round(cohort.avgLifetimeValue).toLocaleString("vi-VN")} ₫ LTV`, `${cohort.customers} khách, repeat ${(cohort.repeatRate * 100).toFixed(1)}%, risk ${cohort.risk}`)),
    actions: [
      "Tách chiến dịch acquisition và retention theo cohort.",
      "Ưu tiên nhóm LTV cao nhưng repeat thấp bằng win-back hoặc loyalty offer.",
      "Kiểm tra return rate trước khi tăng ưu đãi cho cohort rủi ro."
    ],
    confidence: "Trung bình",
    followUps: ["Cohort nào nên win-back?", "Segment nào có LTV cao nhất?", "Return rate theo cohort thế nào?"]
  };
}

function recommendationContext(): InsightContext {
  const dashboard = getDashboard();
  return {
    type: "Executive recommendation",
    summary: "Priority recommendations gom driver, anomaly và profit để đề xuất việc nên làm trước. Đây là góc nhìn điều hành thay vì chỉ mô tả dữ liệu.",
    evidence: dashboard.recommendations.map(item => evidence(`${item.priority} - ${item.area}`, item.expectedImpact, item.action)),
    actions: dashboard.recommendations.map(item => item.action),
    confidence: "Trung bình",
    followUps: ["Nếu chỉ làm 1 việc thì làm gì?", "Việc nào ảnh hưởng profit nhất?", "What-if nào đáng thử?"]
  };
}

function forecastContext(): InsightContext {
  const dashboard = getDashboard();
  return {
    type: "Forecast",
    summary: "Forecast view dùng xu hướng gần nhất để tạo dự báo đơn giản kèm dải bất định. Đây không phải model dự báo production, nhưng đủ để minh họa tư duy BI: luôn đi kèm confidence band.",
    evidence: dashboard.forecast.map(point => evidence(`Forecast ${point.label}`, formatMoney(point.revenue), `Range ${formatMoney(point.lowerBound)} - ${formatMoney(point.upperBound)}, confidence ${point.confidence}`)),
    actions: [
      "Không dùng forecast đơn lẻ để ra quyết định ngân sách; hãy so cùng anomaly và driver.",
      "Nếu forecast giảm, ưu tiên kiểm tra Orders driver trước AOV.",
      "Thêm dữ liệu theo tuần/ngày để nâng chất lượng dự báo."
    ],
    confidence: "Cần thêm dữ liệu",
    followUps: ["Điều gì làm forecast xấu đi?", "Forecast này nhạy với driver nào?", "Cần thêm dữ liệu gì để dự báo tốt hơn?"]
  };
}

function scenarioContext(): InsightContext {
  const dashboard = getDashboard();
  return {
    type: "What-if scenario",
    summary: "What-if scenarios mô phỏng tác động nếu đổi ngân sách, giảm CAC hoặc giảm return cost. Đây là lớp phân tích ra quyết định, không chỉ mô tả hiện trạng.",
    evidence: dashboard.whatIfScenarios.map(item => evidence(item.name, `${formatMoney(item.profitDelta)} profit delta`, `${item.assumption}; revenue delta ${formatMoney(item.revenueDelta)}, risk ${item.risk}`)),
    actions: [
      "Chọn scenario profit delta cao nhưng risk thấp để thử trước.",
      "Chạy thử nhỏ trước khi thay đổi ngân sách lớn.",
      "Sau scenario, đo lại ROAS/CAC/return cost để xác nhận giả định."
    ],
    confidence: "Trung bình",
    followUps: ["Scenario nào ít rủi ro nhất?", "Nếu tăng ngân sách Social thì sao?", "What-if nào tăng profit mạnh nhất?"]
  };
}

function rootCauseContext(): InsightContext {
  const dashboard = getDashboard();
  return {
    type: "Root cause ranking",
    summary: "Root-cause ranking xếp hạng các yếu tố theo impact tuyệt đối: driver doanh thu, conversion/CAC, campaign efficiency, product ops risk và profit.",
    evidence: dashboard.rootCauses.map(item => evidence(`#${item.rank} ${item.factor}`, `${Math.round(item.impact).toLocaleString("vi-VN")} ₫ impact`, `${item.evidence}; confidence ${item.confidence}`)),
    actions: [
      "Xử lý nguyên nhân rank #1 trước, sau đó mới tối ưu các tín hiệu phụ.",
      "Nếu factor top là Orders, ưu tiên acquisition/channel; nếu là AOV, ưu tiên bundle/upsell.",
      "Dùng root-cause cùng anomaly scan để tránh tối ưu sai điểm."
    ],
    confidence: "Trung bình",
    followUps: ["Nguyên nhân #1 xử lý thế nào?", "Root cause có liên quan campaign không?", "Root cause ảnh hưởng forecast thế nào?"]
  };
}

function dataQualityContext(): InsightContext {
  const dashboard = getDashboard();
  return {
    type: "Data quality",
    summary: "Data-quality checks kiểm tra các join chính và sanity rule. Một BI assistant đáng tin phải nói được dữ liệu có sạch không trước khi phân tích sâu.",
    evidence: dashboard.dataQuality.map(item => evidence(`${item.status} - ${item.area}`, `${item.affectedRows} rows`, item.issue)),
    actions: [
      "Không đưa insight production nếu data quality có trạng thái Fail.",
      "Ưu tiên sửa join customer/product trước khi đọc segment hoặc inventory risk.",
      "Ghi data-quality summary vào phần portfolio để thể hiện tư duy dữ liệu đáng tin."
    ],
    confidence: "Cao",
    followUps: ["Dữ liệu nào đang thiếu?", "Join nào quan trọng nhất?", "Có thể tin insight này không?"]
  };
}

function businessReviewContext(): InsightContext {
  const dashboard = getDashboard();
  const topRootCauses = dashboard.rootCauses.slice(0, 3);
  const topAnomalies = dashboard.anomalies.slice(0, 2);
  return {
    type: "360 business review",
    summary: "Đây là góc nhìn tổng hợp: đọc doanh thu qua driver, kiểm tra profit, soi anomaly, rồi mới chuyển thành ưu tiên hành động. Cách này rộng hơn việc chỉ trả lời một KPI đơn lẻ.",
    evidence: [
      ...dashboard.revenueDrivers.map(driver => evidence(`Driver ${driver.name}`, `${Math.round(driver.impact).toLocaleString("vi-VN")} ₫ impact`, `Current ${Math.round(driver.current).toLocaleString("vi-VN")}, previous ${Math.round(driver.previous).toLocaleString("vi-VN")}`)),
      evidence("Contribution profit", formatMoney(dashboard.profit.contributionProfit), `Margin ${(dashboard.profit.marginRate * 100).toFixed(1)}%`),
      ...topRootCauses.map(item => evidence(`#${item.rank} ${item.factor}`, `${Math.round(item.impact).toLocaleString("vi-VN")} ₫ impact`, item.evidence)),
      ...topAnomalies.map(item => evidence(`${item.severity} anomaly - ${item.area}`, item.signal, item.recommendation))
    ],
    actions: dashboard.recommendations.slice(0, 4).map(item => `${item.priority}: ${item.action}`),
    confidence: "Trung bình",
    followUps: ["Nếu chỉ làm 1 việc thì làm gì?", "Root cause chính là gì?", "What-if nào đáng thử?"]
  };
}

function comparisonContext(): InsightContext {
  const dashboard = getDashboard();
  const bestChannel = dashboard.channelDiagnostics[0];
  const worstChannel = [...dashboard.channelDiagnostics].sort((a, b) => a.conversionRate - b.conversionRate)[0];
  const bestCampaign = dashboard.campaignDiagnostics[0];
  const worstCampaign = [...dashboard.campaignDiagnostics].sort((a, b) => a.roas - b.roas)[0];
  return {
    type: "Best versus worst comparison",
    summary: "So sánh best/worst giúp thấy khoảng cách hiệu quả: kênh tốt nhất chưa chắc là kênh nên scale nếu CAC cao, và campaign doanh thu cao chưa chắc hiệu quả nếu ROAS thấp.",
    evidence: [
      evidence("Best revenue channel", `${bestChannel.name}: ${formatMoney(bestChannel.revenue)}`, `CR ${formatPercent(bestChannel.conversionRate)}, CAC ${formatMoney(bestChannel.cac)}`),
      evidence("Worst conversion channel", `${worstChannel.name}: ${formatPercent(worstChannel.conversionRate)}`, `Revenue ${formatMoney(worstChannel.revenue)}, CAC ${formatMoney(worstChannel.cac)}`),
      evidence("Best campaign", `${bestCampaign.name}: ${bestCampaign.roas.toFixed(2)}x ROAS`, `${bestCampaign.channel}, CPC ${formatMoney(bestCampaign.cpc)}`),
      evidence("Worst campaign", `${worstCampaign.name}: ${worstCampaign.roas.toFixed(2)}x ROAS`, `${worstCampaign.channel}, spend ${formatMoney(worstCampaign.spend)}`)
    ],
    actions: [
      "Không chuyển toàn bộ ngân sách chỉ dựa trên doanh thu; dùng ROAS/CAC làm điều kiện.",
      `Test lại offer của ${worstChannel.name} trước khi scale.`,
      `Rút bài học creative/offer từ ${bestCampaign.name} để áp dụng cho campaign yếu.`
    ],
    confidence: "Trung bình",
    followUps: ["Kênh nào nên scale?", "Campaign yếu nhất xử lý sao?", "So sánh Social với Website"]
  };
}

function decisionContext(): InsightContext {
  const dashboard = getDashboard();
  const topScenario = dashboard.whatIfScenarios[0];
  return {
    type: "Decision support",
    summary: "Câu hỏi quyết định nên được trả lời bằng trade-off: tác động kỳ vọng, rủi ro, dữ liệu còn thiếu và hành động thử nhỏ trước khi scale.",
    evidence: [
      evidence("Best what-if scenario", topScenario.name, `${topScenario.assumption}; profit delta ${formatMoney(topScenario.profitDelta)}, risk ${topScenario.risk}`),
      evidence("Contribution profit", formatMoney(dashboard.profit.contributionProfit), `Margin ${(dashboard.profit.marginRate * 100).toFixed(1)}%`),
      ...dashboard.recommendations.slice(0, 2).map(item => evidence(`${item.priority} priority - ${item.area}`, item.expectedImpact, item.action))
    ],
    actions: [
      "Chạy thử scenario có profit delta cao nhất ở quy mô nhỏ.",
      "Đặt guardrail: CAC, ROAS, return cost và contribution profit.",
      "Không scale nếu data-quality hoặc anomaly đang báo rủi ro cao."
    ],
    confidence: "Trung bình",
    followUps: ["Nếu chỉ thử 1 scenario thì chọn gì?", "Rủi ro lớn nhất của quyết định này là gì?", "Cần guardrail KPI nào?"]
  };
}

function kpiContext(): InsightContext {
  const dashboard = getDashboard();
  const improving = dashboard.kpis.filter(kpi => (kpi.change ?? 0) >= 0);
  const declining = dashboard.kpis.filter(kpi => (kpi.change ?? 0) < 0);
  const weakest = [...dashboard.kpis].sort((a, b) => (a.change ?? 0) - (b.change ?? 0))[0];
  return {
    type: "Phân tích KPI",
    summary: `Nhìn nhanh KPI: ${improving.length} chỉ số đang ổn hơn kỳ trước, ${declining.length} chỉ số đang giảm. Chỉ số cần chú ý nhất hiện tại là ${weakest.label} vì biến động ${weakest.change?.toFixed(1) ?? "chưa đủ dữ liệu"}%.`,
    evidence: dashboard.kpis.map(kpi => evidence(kpi.label, kpi.format === "currency" ? formatMoney(kpi.value) : kpi.value.toLocaleString("vi-VN"), `Kỳ trước ${kpi.format === "currency" ? formatMoney(kpi.previous) : kpi.previous.toLocaleString("vi-VN")}, thay đổi ${kpi.change?.toFixed(1) ?? "N/A"}%`)),
    actions: [
      `Theo dõi ${weakest.label} hằng ngày vì đây là KPI yếu nhất trong kỳ.`,
      "Đọc KPI theo chuỗi nguyên nhân: đơn hàng → AOV → doanh thu → lợi nhuận.",
      "Không kết luận kinh doanh tốt chỉ từ doanh thu; cần xem thêm CAC, ROAS, tồn kho và return."
    ],
    confidence: "Cao",
    followUps: ["Nếu chỉ chọn 1 KPI mỗi ngày thì chọn gì?", "KPI nào đang kéo doanh thu xuống?", "Tình hình kinh doanh hiện tại có tốt không?"]
  };
}

function categoryContext(): InsightContext {
  const dashboard = getDashboard();
  const categories = dashboard.categories;
  const totalRevenue = categories.reduce((sum, item) => sum + item.revenue, 0);
  const topCategory = categories[0];
  const weakestCategory = categories[categories.length - 1];
  return {
    type: "Phân tích danh mục sản phẩm",
    summary: `${topCategory.name} là danh mục tạo doanh thu lớn nhất với ${formatMoney(topCategory.revenue)}. Danh mục yếu nhất là ${weakestCategory.name} với ${formatMoney(weakestCategory.revenue)}. Nên ưu tiên danh mục có doanh thu cao nhưng vẫn phải kiểm tra tồn kho, return rate và biên lợi nhuận trước khi mở rộng.`,
    evidence: categories.map(item => evidence(`Danh mục ${item.name}`, formatMoney(item.revenue), `${item.orders} dòng đơn, chiếm ${totalRevenue === 0 ? "0.0" : ((item.revenue / totalRevenue) * 100).toFixed(1)}% doanh thu`)),
    actions: [
      `Ưu tiên marketing cho ${topCategory.name} nếu tồn kho và return rate vẫn an toàn.`,
      `Rà soát ${weakestCategory.name}: vấn đề có thể nằm ở nhu cầu thấp, offer yếu hoặc kênh bán chưa đúng.`,
      "So sánh danh mục theo doanh thu, số đơn và sản phẩm top để tránh mở rộng sai nhóm."
    ],
    confidence: "Cao",
    followUps: ["Có nên mở rộng danh mục nào không?", "Danh mục nào cần cải thiện?", "Tỷ trọng doanh thu từng danh mục là bao nhiêu?"]
  };
}

function ceoReportContext(): InsightContext {
  const dashboard = getDashboard();
  const revenue = dashboard.kpis[0];
  const topCause = dashboard.rootCauses[0];
  const topRecommendation = dashboard.recommendations[0];
  const worstCampaign = [...dashboard.campaignDiagnostics].sort((a, b) => a.roas - b.roas)[0];
  const riskyProduct = dashboard.productRisks.find(product => product.risk === "High") ?? dashboard.productRisks[0];
  return {
    type: "Báo cáo điều hành",
    summary: `Báo cáo ngắn cho CEO: doanh thu hiện tại là ${formatMoney(revenue.value)}, thay đổi ${revenue.change?.toFixed(1) ?? "N/A"}% so với tháng trước. Vấn đề lớn nhất không nên nhìn riêng doanh thu, mà là ${topCause.factor}. Điểm cần xử lý trước là ${topRecommendation.action} Nếu cần ra quyết định nhanh, hãy kiểm soát campaign ROAS thấp, sản phẩm rủi ro và KPI doanh thu theo ngày.`,
    evidence: [
      evidence("Doanh thu hiện tại", formatMoney(revenue.value), `So với tháng trước ${revenue.change?.toFixed(1) ?? "N/A"}%`),
      evidence(`Nguyên nhân số 1: ${topCause.factor}`, `${Math.round(topCause.impact).toLocaleString("vi-VN")} ₫`, topCause.evidence),
      evidence(`Campaign cần chú ý: ${worstCampaign.name}`, `${worstCampaign.roas.toFixed(2)}x ROAS`, `${worstCampaign.channel}, spend ${formatMoney(worstCampaign.spend)}`),
      evidence(`Sản phẩm rủi ro: ${riskyProduct.name}`, `Risk ${riskyProduct.risk}`, `Tồn ${riskyProduct.stock}, return ${formatPercent(riskyProduct.returnRate)}`),
      evidence("Lợi nhuận đóng góp", formatMoney(dashboard.profit.contributionProfit), `Margin ${(dashboard.profit.marginRate * 100).toFixed(1)}%`)
    ],
    actions: [
      topRecommendation.action,
      `Giảm hoặc test lại ${worstCampaign.name} nếu ROAS chưa cải thiện.`,
      `Kiểm tra tồn kho và lý do trả hàng của ${riskyProduct.name}.`,
      "Lập báo cáo ngày gồm 1 KPI chính: doanh thu, kèm 3 guardrail là CAC, ROAS và return rate."
    ],
    confidence: "Trung bình",
    followUps: ["Hãy tạo báo cáo gửi CEO từ dữ liệu này", "Đưa ra 3 hành động ưu tiên", "Nếu là giám đốc kinh doanh thì nên làm gì?"]
  };
}

function plainLanguageContext(): InsightContext {
  const dashboard = getDashboard();
  const revenue = dashboard.kpis[0];
  const topChannel = dashboard.channelDiagnostics[0];
  const hotProduct = dashboard.productRisks[0];
  const issue = dashboard.anomalies[0];
  return {
    type: "Giải thích dễ hiểu",
    summary: `Nói đơn giản: tháng này công ty đang có ${formatMoney(revenue.value)} doanh thu, ${revenue.change && revenue.change < 0 ? "đang giảm" : "đang tăng hoặc ổn"} so với tháng trước. Tiền chủ yếu đến từ kênh ${topChannel.name}. Món đáng chú ý là ${hotProduct.name}. Điều đáng lo nhất hiện tại là ${issue ? issue.area : "chưa có cảnh báo lớn"}.`,
    evidence: [
      evidence("Doanh thu", formatMoney(revenue.value), `Thay đổi ${revenue.change?.toFixed(1) ?? "N/A"}% so với tháng trước`),
      evidence(`Kênh đem tiền nhiều nhất: ${topChannel.name}`, formatMoney(topChannel.revenue), `Chiếm ${(topChannel.revenueShare * 100).toFixed(1)}% doanh thu`),
      evidence(`Sản phẩm nổi bật: ${hotProduct.name}`, formatMoney(hotProduct.revenue), `${hotProduct.orders} dòng đơn, risk ${hotProduct.risk}`),
      ...(issue ? [evidence(`Điểm đáng lo: ${issue.area}`, issue.signal, issue.recommendation)] : [])
    ],
    actions: [
      "Giữ kênh đang tạo tiền tốt, nhưng kiểm tra chi phí trước khi tăng ngân sách.",
      "Ưu tiên sản phẩm bán tốt nhưng phải đảm bảo không thiếu hàng hoặc bị trả nhiều.",
      "Xử lý cảnh báo lớn nhất trước khi chạy thêm marketing."
    ],
    confidence: "Cao",
    followUps: ["Tiền đang đến từ đâu?", "Có món nào đang hot không?", "Có gì đáng lo trong báo cáo này không?"]
  };
}

function marketingBudgetContext(): InsightContext {
  const dashboard = getDashboard();
  const bestCampaign = dashboard.campaignDiagnostics[0];
  const worstCampaign = [...dashboard.campaignDiagnostics].sort((a, b) => a.roas - b.roas)[0];
  const bestChannel = [...dashboard.channelDiagnostics].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const highCac = [...dashboard.channelDiagnostics].sort((a, b) => b.cac - a.cac)[0];
  return {
    type: "Tư vấn ngân sách marketing",
    summary: `Nếu có thêm ngân sách, nên ưu tiên nơi có tín hiệu hiệu quả: ${bestCampaign.name} và kênh ${bestChannel.name}. Nếu phải cắt giảm, nên soi trước ${worstCampaign.name} vì ROAS thấp và kênh ${highCac.name} vì CAC cao.`,
    evidence: [
      evidence(`Campaign nên tăng thử: ${bestCampaign.name}`, `${bestCampaign.roas.toFixed(2)}x ROAS`, `${bestCampaign.channel}, revenue gán kênh ${formatMoney(bestCampaign.attributedRevenue)}`),
      evidence(`Campaign nên giảm/test lại: ${worstCampaign.name}`, `${worstCampaign.roas.toFixed(2)}x ROAS`, `${worstCampaign.channel}, spend ${formatMoney(worstCampaign.spend)}`),
      evidence(`Kênh conversion tốt: ${bestChannel.name}`, formatPercent(bestChannel.conversionRate), `CAC ${formatMoney(bestChannel.cac)}, AOV ${formatMoney(bestChannel.aov)}`),
      evidence(`Kênh CAC cao: ${highCac.name}`, formatMoney(highCac.cac), `Spend ${formatMoney(highCac.spend)}, conversion ${formatPercent(highCac.conversionRate)}`)
    ],
    actions: [
      "Phân bổ ngân sách tăng thêm theo kiểu test nhỏ trước: 60% cho kênh/campaign hiệu quả, 30% tối ưu offer, 10% thử nghiệm creative mới.",
      `Tạm giảm ngân sách ${worstCampaign.name} cho đến khi ROAS cải thiện.`,
      `Không tăng mạnh ${highCac.name} nếu chưa giảm được CAC hoặc cải thiện conversion.`
    ],
    confidence: "Trung bình",
    followUps: ["Nếu có thêm 100 triệu ngân sách thì phân bổ thế nào?", "Nếu phải cắt chi phí marketing thì cắt ở đâu?", "Campaign nào nên dừng?"]
  };
}

function productCustomerCorrelationContext(): InsightContext {
  const dashboard = getDashboard();
  const topProduct = dashboard.productRisks[0];
  const topSegment = dashboard.segmentDiagnostics[0];
  const vip = dashboard.segmentDiagnostics.find(segment => segment.name === "VIP") ?? topSegment;
  return {
    type: "Tương quan sản phẩm và khách hàng",
    summary: `Có thể đọc tương quan theo hướng thực dụng: sản phẩm ${topProduct.name} đang tạo nhiều doanh thu, còn nhóm ${topSegment.name} là nhóm khách hàng đóng góp lớn nhất. Với dữ liệu demo hiện tại, đây là phân tích liên kết theo doanh thu/đơn hàng chứ chưa phải hệ số tương quan thống kê đầy đủ.`,
    evidence: [
      evidence(`Sản phẩm doanh thu cao: ${topProduct.name}`, formatMoney(topProduct.revenue), `${topProduct.orders} dòng đơn, return ${formatPercent(topProduct.returnRate)}`),
      evidence(`Nhóm khách hàng đóng góp lớn: ${topSegment.name}`, formatMoney(topSegment.revenue), `${topSegment.customers} khách, AOV ${formatMoney(topSegment.aov)}`),
      evidence("Nhóm VIP", formatMoney(vip.revenue), `${vip.customers} khách, AOV ${formatMoney(vip.aov)}, return ${formatPercent(vip.returnRate)}`)
    ],
    actions: [
      `Test campaign riêng cho ${topProduct.name} nhắm vào nhóm ${topSegment.name}/VIP.`,
      "Bổ sung ma trận product × segment để đo chính xác nhóm khách nào mua sản phẩm nào nhiều nhất.",
      "Dùng AOV và return rate để tránh chọn nhóm mua nhiều nhưng lợi nhuận thấp."
    ],
    confidence: "Cần thêm dữ liệu",
    followUps: ["Hãy đề xuất campaign cho nhóm VIP", "Sản phẩm nào hợp với khách VIP?", "Nhóm khách nào nên chăm sóc đặc biệt?"]
  };
}

function businessRiskContext(): InsightContext {
  const dashboard = getDashboard();
  const forecast = dashboard.forecast[0];
  const topAnomalies = dashboard.anomalies.slice(0, 3);
  return {
    type: "Dự đoán rủi ro kinh doanh",
    summary: `Rủi ro chính hiện tại nằm ở 3 lớp: doanh thu có thể tiếp tục yếu theo forecast, campaign/chi phí có thể ăn mòn lợi nhuận, và sản phẩm rủi ro có thể làm mất doanh thu hoặc tăng return cost. Nếu doanh thu giảm thêm 15% tháng sau, nên kiểm tra lần lượt: số đơn, conversion kênh, ROAS campaign, tồn kho và return rate.`,
    evidence: [
      evidence(`Dự báo gần nhất ${forecast.label}`, formatMoney(forecast.revenue), `Dải ${formatMoney(forecast.lowerBound)} - ${formatMoney(forecast.upperBound)}, độ tin cậy ${forecast.confidence}`),
      ...topAnomalies.map(item => evidence(`${item.severity} - ${item.area}`, item.signal, item.recommendation)),
      evidence("Lợi nhuận đóng góp", formatMoney(dashboard.profit.contributionProfit), `Margin ${(dashboard.profit.marginRate * 100).toFixed(1)}%`)
    ],
    actions: [
      "Lập cảnh báo ngày cho doanh thu, số đơn, CAC, ROAS và return rate.",
      "Nếu doanh thu giảm tiếp, kiểm tra volume đơn trước rồi mới kiểm tra AOV.",
      "Dừng scale các campaign ROAS thấp cho đến khi lợi nhuận đóng góp cải thiện."
    ],
    confidence: "Trung bình",
    followUps: ["Nếu doanh thu giảm 15% tháng sau thì nguyên nhân có thể là gì?", "Rủi ro lớn nhất là gì?", "KPI nào nên theo dõi mỗi ngày?"]
  };
}

function advancedRootCauseContext(): InsightContext {
  const dashboard = getDashboard();
  const worstChannel = [...dashboard.channelDiagnostics].sort((a, b) => a.conversionRate - b.conversionRate)[0];
  const weakestProduct = [...dashboard.productRisks].sort((a, b) => a.revenue - b.revenue)[0];
  const weakestSegment = [...dashboard.segmentDiagnostics].sort((a, b) => a.revenue - b.revenue)[0];
  return {
    type: "Phân tích nguyên nhân nhiều tầng",
    summary: `Doanh thu giảm nên được đọc theo 4 tầng: tổng doanh thu giảm vì driver chính là ${dashboard.revenueDrivers[0].name}; tầng kênh có điểm yếu nhất là ${worstChannel.name}; tầng sản phẩm cần soi ${weakestProduct.name}; tầng khách hàng cần chú ý nhóm ${weakestSegment.name}. Cách này giúp biết vấn đề nằm ở khách hàng, sản phẩm hay kênh bán, thay vì chỉ nói “doanh thu giảm”.`,
    evidence: [
      ...dashboard.revenueDrivers.map(driver => evidence(driver.name === "Orders" ? "Tầng 1 - Số đơn hàng" : "Tầng 1 - Giá trị đơn trung bình", `${Math.round(driver.impact).toLocaleString("vi-VN")} ₫`, `Hiện tại ${Math.round(driver.current).toLocaleString("vi-VN")}, kỳ trước ${Math.round(driver.previous).toLocaleString("vi-VN")}`)),
      evidence(`Tầng 2 - Kênh yếu: ${worstChannel.name}`, formatPercent(worstChannel.conversionRate), `CAC ${formatMoney(worstChannel.cac)}, doanh thu ${formatMoney(worstChannel.revenue)}`),
      evidence(`Tầng 3 - Sản phẩm yếu: ${weakestProduct.name}`, formatMoney(weakestProduct.revenue), `${weakestProduct.orders} dòng đơn, return ${formatPercent(weakestProduct.returnRate)}`),
      evidence(`Tầng 4 - Nhóm khách yếu: ${weakestSegment.name}`, formatMoney(weakestSegment.revenue), `${weakestSegment.customers} khách, AOV ${formatMoney(weakestSegment.aov)}`)
    ],
    actions: [
      "Nếu driver số đơn là nguyên nhân lớn nhất, ưu tiên kênh bán và campaign.",
      "Nếu driver AOV là nguyên nhân lớn nhất, ưu tiên bundle, upsell và mix sản phẩm.",
      `Kiểm tra ${worstChannel.name} trước vì conversion thấp/CAC cao thường gây tác động tiêu cực nhanh.`,
      `Rà soát ${weakestProduct.name}: có thể ít nhu cầu, giá chưa hợp lý hoặc chưa được quảng bá đúng nhóm.`
    ],
    confidence: "Trung bình",
    followUps: ["Kênh nào gây ảnh hưởng tiêu cực nhất?", "Sản phẩm nào kéo doanh thu xuống?", "Nếu doanh thu giảm 10% thì nguyên nhân có khả năng nhất?"]
  };
}

function benchmarkContext(): InsightContext {
  const dashboard = getDashboard();
  const bestChannel = [...dashboard.channelDiagnostics].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const growthChannel = [...dashboard.channelDiagnostics].sort((a, b) => b.revenueShare - a.revenueShare)[0];
  const bestCampaign = dashboard.campaignDiagnostics[0];
  const avgRoas = dashboard.campaignDiagnostics.reduce((sum, item) => sum + item.roas, 0) / Math.max(dashboard.campaignDiagnostics.length, 1);
  const aboveAvg = dashboard.campaignDiagnostics.filter(item => item.roas >= avgRoas);
  const belowAvg = dashboard.campaignDiagnostics.filter(item => item.roas < avgRoas);
  return {
    type: "So sánh và benchmark",
    summary: `Benchmark hiện tại cho thấy ${bestChannel.name} có conversion tốt nhất, ${growthChannel.name} đang đóng góp tỷ trọng doanh thu lớn, và ${bestCampaign.name} là campaign vượt trung bình ROAS rõ nhất. Các campaign dưới trung bình cần được giảm scale hoặc test lại offer/creative.`,
    evidence: [
      ...dashboard.channelDiagnostics.map(channel => evidence(`Kênh ${channel.name}`, formatMoney(channel.revenue), `CR ${formatPercent(channel.conversionRate)}, CAC ${formatMoney(channel.cac)}, tỷ trọng ${(channel.revenueShare * 100).toFixed(1)}%`)),
      evidence("ROAS trung bình campaign", `${avgRoas.toFixed(2)}x`, `${aboveAvg.length} campaign trên trung bình, ${belowAvg.length} campaign dưới trung bình`),
      ...belowAvg.slice(0, 2).map(item => evidence(`Dưới trung bình: ${item.name}`, `${item.roas.toFixed(2)}x ROAS`, `${item.channel}, spend ${formatMoney(item.spend)}`))
    ],
    actions: [
      `Lấy ${bestChannel.name} làm benchmark conversion/CAC cho các kênh còn lại.`,
      `Dùng ${bestCampaign.name} làm mẫu để học offer, audience hoặc creative.`,
      "Campaign dưới ROAS trung bình nên test lại trước khi tăng ngân sách."
    ],
    confidence: "Cao",
    followUps: ["Campaign nào vượt kỳ vọng?", "Campaign nào kém hơn trung bình?", "So sánh hiệu suất marketing giữa các tháng."]
  };
}

function customerIntelligenceContext(): InsightContext {
  const dashboard = getDashboard();
  const customers = customerRevenueRows();
  const topCustomers = customers.slice(0, 10);
  const likelyRepeat = [...customers].sort((a, b) => b.orders - a.orders || b.lifetimeValue - a.lifetimeValue).slice(0, 5);
  const staleCustomers = [...customers].sort((a, b) => a.lastOrderDate.localeCompare(b.lastOrderDate)).slice(0, 5);
  const vip = dashboard.segmentDiagnostics.find(item => item.name === "VIP");
  const returning = dashboard.segmentDiagnostics.find(item => item.name === "Returning");
  const newer = dashboard.segmentDiagnostics.find(item => item.name === "New");
  return {
    type: "Customer intelligence",
    summary: `Nhóm khách hàng nên được đọc theo giá trị, tần suất mua và thời gian quay lại. Top 10 khách giá trị nhất đang tạo ${formatMoney(topCustomers.reduce((sum, item) => sum + item.revenue, 0))}. Nhóm nên ưu tiên loyalty là ${vip?.revenue && returning?.revenue && vip.revenue >= returning.revenue ? "VIP" : "Returning/VIP"} vì có giá trị cao hơn khách mới.`,
    evidence: [
      ...topCustomers.slice(0, 5).map(customer => evidence(`Top customer ${customer.id}`, formatMoney(customer.revenue), `${customer.segment}, ${customer.orders} đơn, LTV ${formatMoney(customer.lifetimeValue)}, mua gần nhất ${customer.lastOrderDate}`)),
      evidence("Khách có khả năng mua lại", likelyRepeat.map(item => item.id).join(", "), "Dựa trên số lần mua và LTV cao trong dữ liệu demo"),
      evidence("Khách lâu chưa quay lại", staleCustomers.map(item => item.id).join(", "), "Dựa trên ngày mua gần nhất"),
      ...(vip ? [evidence("Nhóm VIP", formatMoney(vip.revenue), `${vip.customers} khách, AOV ${formatMoney(vip.aov)}`)] : []),
      ...(newer ? [evidence("Nhóm khách mới", formatMoney(newer.revenue), `${newer.customers} khách, AOV ${formatMoney(newer.aov)}`)] : [])
    ],
    actions: [
      "Tạo nhóm loyalty cho VIP/Returning có LTV cao và mua lặp lại.",
      "Tạo win-back list cho khách lâu chưa quay lại nhưng từng có doanh thu cao.",
      "Phân nhóm khách thành: VIP giữ chân, Returning tăng tần suất, New kích hoạt mua lần 2, At Risk win-back."
    ],
    confidence: "Trung bình",
    followUps: ["Ai là 10 khách hàng có giá trị nhất?", "Khách hàng nào lâu rồi chưa quay lại?", "Tỷ lệ giữ chân khách hàng hiện tại là bao nhiêu?"]
  };
}

function churnContext(): InsightContext {
  const dashboard = getDashboard();
  const customers = customerRevenueRows();
  const atRisk = customers.filter(customer => customer.segment === "At Risk").slice(0, 8);
  const vip = dashboard.segmentDiagnostics.find(segment => segment.name === "VIP");
  const vipLoss = (vip?.revenue ?? 0) * 0.1;
  return {
    type: "Customer churn",
    summary: `Có dấu hiệu churn ở nhóm At Risk và một phần VIP nếu tần suất mua giảm. Nếu mất 10% doanh thu từ VIP, tác động ước tính là ${formatMoney(vipLoss)}. Việc cần làm là giữ chân khách giá trị cao trước, sau đó mới mở rộng acquisition.`,
    evidence: [
      evidence("Khách nguy cơ churn", atRisk.map(item => item.id).join(", "), "Nhóm At Risk, ưu tiên người có LTV/doanh thu cao"),
      ...(vip ? [evidence("Doanh thu VIP", formatMoney(vip.revenue), `10% VIP revenue tương đương ${formatMoney(vipLoss)}`)] : []),
      ...dashboard.cohorts.map(cohort => evidence(`Cohort ${cohort.segment}`, `${formatPercent(cohort.repeatRate)} repeat`, `LTV ${formatMoney(cohort.avgLifetimeValue)}, risk ${cohort.risk}`))
    ],
    actions: [
      "Gửi ưu đãi win-back riêng cho At Risk có doanh thu/LTV cao.",
      "Với VIP, ưu tiên chăm sóc cá nhân hóa thay vì giảm giá đại trà.",
      "Theo dõi repeat rate và số ngày từ lần mua gần nhất như cảnh báo churn."
    ],
    confidence: "Trung bình",
    followUps: ["Vì sao khách hàng VIP không còn mua hàng?", "Tôi nên làm gì để giữ chân khách hàng?", "Nếu mất 10% khách VIP thì ảnh hưởng thế nào?"]
  };
}

function salesOptimizationContext(): InsightContext {
  const dashboard = getDashboard();
  const lowConversion = [...dashboard.channelDiagnostics].sort((a, b) => a.conversionRate - b.conversionRate)[0];
  const highTrafficLowOrders = [...dashboard.channelDiagnostics].sort((a, b) => b.traffic / Math.max(b.orders, 1) - a.traffic / Math.max(a.orders, 1))[0];
  const bundleCandidates = dashboard.productRisks.slice(0, 2);
  return {
    type: "Tối ưu bán hàng",
    summary: `Điểm nghẽn bán hàng dễ thấy nhất là conversion của ${lowConversion.name}. Funnel có thể mất khách ở bước traffic → đơn hàng vì ${highTrafficLowOrders.name} có nhiều traffic nhưng hiệu quả chuyển đổi chưa tốt. Nên tập trung bán ${bundleCandidates[0].name} và bundle với ${bundleCandidates[1]?.name ?? "sản phẩm bổ trợ"}.`,
    evidence: [
      evidence(`Conversion thấp: ${lowConversion.name}`, formatPercent(lowConversion.conversionRate), `Traffic ${lowConversion.traffic.toLocaleString("vi-VN")}, orders ${lowConversion.orders}, CAC ${formatMoney(lowConversion.cac)}`),
      evidence(`Traffic nhiều nhưng mua ít: ${highTrafficLowOrders.name}`, `${highTrafficLowOrders.traffic.toLocaleString("vi-VN")} traffic`, `${highTrafficLowOrders.orders} dòng đơn, CR ${formatPercent(highTrafficLowOrders.conversionRate)}`),
      ...bundleCandidates.map(product => evidence(`Ứng viên bundle: ${product.name}`, formatMoney(product.revenue), `${product.orders} dòng đơn, tồn ${product.stock}, risk ${product.risk}`))
    ],
    actions: [
      `Tối ưu landing page/offer của ${lowConversion.name} trước khi tăng traffic.`,
      `Bundle ${bundleCandidates[0].name} với ${bundleCandidates[1]?.name ?? "sản phẩm giá thấp"} để tăng AOV.`,
      "Kiểm tra sản phẩm có nhiều quan tâm nhưng ít mua bằng traffic, add-to-cart và conversion ở phiên bản dữ liệu sau."
    ],
    confidence: "Trung bình",
    followUps: ["Tại sao conversion rate giảm?", "Giai đoạn nào trong funnel mất khách nhiều nhất?", "Sản phẩm nào nên bundle với nhau?"]
  };
}

function inventoryManagementContext(): InsightContext {
  const dashboard = getDashboard();
  const risky = dashboard.productRisks.filter(product => product.risk !== "Low");
  const needRestock = [...dashboard.productRisks].sort((a, b) => (a.stock - a.reorderPoint) - (b.stock - b.reorderPoint)).slice(0, 3);
  const slow = [...dashboard.productRisks].sort((a, b) => a.orders - b.orders).slice(0, 3);
  const profitable = [...dashboard.productRisks].sort((a, b) => b.revenue * (1 - b.returnRate) - a.revenue * (1 - a.returnRate))[0];
  return {
    type: "Quản trị tồn kho và sản phẩm",
    summary: `${needRestock[0].name} là sản phẩm cần kiểm tra nhập thêm trước vì tồn kho sát/ngưỡng thấp. Sản phẩm có lợi nhuận ước tính tốt nhất là ${profitable.name} nếu tính doanh thu sau rủi ro return. Nhóm bán chậm cần được xử lý bằng giảm tồn, bundle hoặc giảm ngân sách quảng bá.`,
    evidence: [
      ...needRestock.map(product => evidence(`Cần nhập/kiểm tồn: ${product.name}`, `Tồn ${product.stock}`, `Reorder point ${product.reorderPoint}, lead time cần chú ý`)),
      ...slow.map(product => evidence(`Bán chậm: ${product.name}`, `${product.orders} dòng đơn`, `Doanh thu ${formatMoney(product.revenue)}, risk ${product.risk}`)),
      evidence(`Lợi nhuận ước tính tốt: ${profitable.name}`, formatMoney(profitable.revenue * (1 - profitable.returnRate)), `Doanh thu ${formatMoney(profitable.revenue)}, return ${formatPercent(profitable.returnRate)}`),
      evidence("Số sản phẩm rủi ro", risky.length.toLocaleString("vi-VN"), "Risk Medium/High theo tồn kho và return rate")
    ],
    actions: [
      `Kiểm tra nhập thêm ${needRestock[0].name} trước khi chạy quảng cáo mạnh.`,
      "Đẩy marketing cho sản phẩm doanh thu tốt, tồn đủ và return thấp.",
      "Sản phẩm bán chậm nên bundle hoặc giảm tồn thay vì tăng quảng cáo riêng lẻ."
    ],
    confidence: "Cao",
    followUps: ["Sản phẩm nào cần nhập thêm?", "Sản phẩm nào bán chậm?", "Sản phẩm nào mang lại nhiều lợi nhuận nhất?"]
  };
}

function strategyContext(): InsightContext {
  const dashboard = getDashboard();
  const topIssue = dashboard.rootCauses[0];
  const topOpportunity = dashboard.whatIfScenarios[0];
  const bestChannel = dashboard.channelDiagnostics[0];
  return {
    type: "Chiến lược kinh doanh",
    summary: `Nếu đóng vai CEO, mình sẽ chọn chiến lược 90 ngày: 30 ngày đầu xử lý ${topIssue.factor}, 30 ngày tiếp theo tối ưu kênh ${bestChannel.name}, 30 ngày cuối scale có kiểm soát scenario "${topOpportunity.name}". Ưu tiên hiện tại là tối ưu sản phẩm/kênh trước khi mở rộng thị trường mới.`,
    evidence: [
      evidence("Vấn đề lớn nhất", topIssue.factor, `${Math.round(topIssue.impact).toLocaleString("vi-VN")} ₫ impact; ${topIssue.evidence}`),
      evidence("Cơ hội what-if", topOpportunity.name, `${topOpportunity.assumption}; profit delta ${formatMoney(topOpportunity.profitDelta)}`),
      evidence(`Kênh tăng trưởng chính: ${bestChannel.name}`, formatMoney(bestChannel.revenue), `CR ${formatPercent(bestChannel.conversionRate)}, CAC ${formatMoney(bestChannel.cac)}`),
      ...dashboard.recommendations.slice(0, 2).map(item => evidence(`${item.priority} - ${item.area}`, item.expectedImpact, item.action))
    ],
    actions: [
      "0–30 ngày: sửa nguyên nhân doanh thu/lợi nhuận lớn nhất.",
      "31–60 ngày: tối ưu channel/campaign bằng CAC, ROAS, conversion.",
      "61–90 ngày: scale sản phẩm/kênh thắng, nhưng đặt guardrail tồn kho và return rate.",
      "Chưa nên mở rộng thị trường nếu kênh hiện tại còn CAC cao hoặc conversion yếu."
    ],
    confidence: "Trung bình",
    followUps: ["Nên mở rộng thị trường hay tối ưu sản phẩm?", "Cơ hội tăng trưởng lớn nhất hiện tại là gì?", "Kế hoạch tăng trưởng 90 ngày là gì?"]
  };
}

function predictionContext(): InsightContext {
  const dashboard = getDashboard();
  const forecast = dashboard.forecast[0];
  const product = dashboard.productRisks[0];
  const segment = dashboard.cohorts[0];
  const campaign = dashboard.campaignDiagnostics[0];
  const endYearProjection = forecast.revenue * 5;
  return {
    type: "Dự báo và dự đoán",
    summary: `Dự báo tháng sau khoảng ${formatMoney(forecast.revenue)} trong dải ${formatMoney(forecast.lowerBound)} - ${formatMoney(forecast.upperBound)}. Sản phẩm có khả năng tăng trưởng nên theo dõi là ${product.name}; nhóm khách có khả năng mua lại tốt là ${segment.segment}; campaign có ROI tốt nhất hiện tại là ${campaign.name}.`,
    evidence: [
      evidence("Doanh thu tháng sau", formatMoney(forecast.revenue), `Dải dự báo ${formatMoney(forecast.lowerBound)} - ${formatMoney(forecast.upperBound)}`),
      evidence("Ước tính đến cuối năm", formatMoney(endYearProjection), "Ước tính đơn giản nếu xu hướng tháng gần nhất kéo dài 5 tháng còn lại"),
      evidence(`Sản phẩm theo dõi: ${product.name}`, formatMoney(product.revenue), `${product.orders} dòng đơn, risk ${product.risk}`),
      evidence(`Nhóm mua lại tốt: ${segment.segment}`, formatPercent(segment.repeatRate), `LTV ${formatMoney(segment.avgLifetimeValue)}, risk ${segment.risk}`),
      evidence(`Campaign ROI tốt: ${campaign.name}`, `${campaign.roas.toFixed(2)}x ROAS`, `${campaign.channel}, spend ${formatMoney(campaign.spend)}`)
    ],
    actions: [
      "Dùng dự báo như cảnh báo sớm, không dùng một mình để quyết định ngân sách.",
      `Ưu tiên giữ tồn kho cho ${product.name} nếu tiếp tục quảng bá.`,
      `Scale thử ${campaign.name} với giới hạn CAC/ROAS rõ ràng.`
    ],
    confidence: "Cần thêm dữ liệu",
    followUps: ["Dự đoán sản phẩm nào sẽ tăng trưởng?", "Dự đoán xu hướng khách hàng trong 3 tháng tới.", "Dự đoán campaign nào có ROI tốt nhất."]
  };
}

function detailedScenarioContext(question: string): InsightContext {
  const dashboard = getDashboard();
  const normalized = normalizeQuestion(question);
  const revenue = dashboard.kpis[0].value;
  const vip = dashboard.segmentDiagnostics.find(segment => segment.name === "VIP");
  const email = dashboard.channelDiagnostics.find(channel => channel.name === "Email");
  const social = dashboard.channelDiagnostics.find(channel => channel.name === "Social");
  const selected = normalized.includes("tang gia")
    ? { name: "Tăng giá 10%", impact: revenue * -0.03, assumption: "Giá tăng có thể tăng AOV nhưng giảm conversion; giả định net revenue giảm nhẹ nếu chưa cải thiện offer." }
    : normalized.includes("giam gia")
      ? { name: "Giảm giá 5%", impact: revenue * 0.04, assumption: "Giảm giá có thể tăng đơn, nhưng cần kiểm soát margin và return." }
      : normalized.includes("email")
        ? { name: "Dừng Email Marketing", impact: -(email?.revenue ?? 0) * 0.35, assumption: "Email thường có CAC thấp; dừng hẳn có thể làm mất doanh thu retention." }
        : normalized.includes("vip")
          ? { name: "Mất khách VIP", impact: -(vip?.revenue ?? 0) * (normalized.includes("20") ? 0.2 : 0.1), assumption: "VIP thường có AOV/LTV cao nên mất nhóm này ảnh hưởng vượt tỷ lệ khách." }
          : normalized.includes("facebook") || normalized.includes("social")
            ? { name: "Tăng Facebook/Social Ads", impact: (social?.revenue ?? 0) * 0.08, assumption: "Có thể tăng doanh thu nếu giảm CAC/conversion không xấu thêm; hiện cần test nhỏ." }
            : { name: "Mở kênh bán hàng mới", impact: revenue * 0.05, assumption: "Nên mở khi kênh hiện tại đã có benchmark CAC/ROAS rõ, tránh phân tán nguồn lực." };
  return {
    type: "Phân tích kịch bản what-if",
    summary: `Kịch bản "${selected.name}" có tác động ước tính ${formatMoney(selected.impact)}. Đây là mô phỏng nhanh dựa trên dữ liệu hiện tại, dùng để chọn hướng test nhỏ trước khi thay đổi lớn.`,
    evidence: [
      evidence(selected.name, formatMoney(selected.impact), selected.assumption),
      evidence("Doanh thu nền", formatMoney(revenue), "Mốc để tính tác động kịch bản"),
      ...(vip ? [evidence("Doanh thu VIP", formatMoney(vip.revenue), `${vip.customers} khách, AOV ${formatMoney(vip.aov)}`)] : []),
      ...(email ? [evidence("Kênh Email", formatMoney(email.revenue), `CAC ${formatMoney(email.cac)}, CR ${formatPercent(email.conversionRate)}`)] : [])
    ],
    actions: [
      "Chạy A/B test nhỏ trước khi áp dụng toàn bộ.",
      "Đặt guardrail: doanh thu, AOV, conversion, CAC, ROAS và margin.",
      "Nếu kịch bản làm giảm profit hoặc tăng CAC, dừng sớm thay vì cố scale."
    ],
    confidence: "Cần thêm dữ liệu",
    followUps: ["Nếu tăng ngân sách Facebook Ads thì sao?", "Nếu dừng Email Marketing thì ảnh hưởng thế nào?", "Nếu tăng giá sản phẩm 10% thì sao?"]
  };
}

export function buildInsightContext(question: string): InsightContext {
  const normalized = normalizeQuestion(question);
  const mentionsCampaign = normalized.includes("campaign") || normalized.includes("chien dich") || normalized.includes("quang cao") || normalized.includes("roas") || normalized.includes("dot tien") || normalized.includes("ngan sach");
  if (normalized.includes("hom nay co gi dang chu y") || normalized.includes("xu ly ngay") || normalized.includes("cai thien mot thu") || normalized.includes("mat tien") || normalized.includes("30 giay") || normalized.includes("co van kinh doanh")) return ceoReportContext();
  if (normalized.includes("nguoi khong chuyen") || normalized.includes("ban on") || normalized.includes("mon nao") || normalized.includes("dang hot") || normalized.includes("tien dang den tu dau") || normalized.includes("dang lo")) return plainLanguageContext();
  if (normalized.includes("ceo") || normalized.includes("giam doc") || normalized.includes("bao cao gui") || normalized.includes("5 van de") || normalized.includes("5 cau") || normalized.includes("3 hanh dong")) return ceoReportContext();
  if (normalized.includes("kpi")) return kpiContext();
  if (normalized.includes("danh muc") || normalized.includes("category")) return categoryContext();
  if (normalized.includes("churn") || normalized.includes("roi bo") || normalized.includes("giu chan") || normalized.includes("khong con mua") || normalized.includes("mat 10% khach") || normalized.includes("mat 20% khach")) return churnContext();
  if (normalized.includes("tang gia") || normalized.includes("giam gia") || normalized.includes("dung email") || normalized.includes("kenh ban hang moi") || normalized.includes("chi tap trung vao") || normalized.includes("tang ngan sach facebook") || normalized.includes("mat 20% khach vip")) return detailedScenarioContext(question);
  if (normalized.includes("correlation") || normalized.includes("tuong quan") || (normalized.includes("san pham") && normalized.includes("nhom khach"))) return productCustomerCorrelationContext();
  if (normalized.includes("rui ro kinh doanh") || normalized.includes("giam 15") || normalized.includes("kha nang rui ro")) return businessRiskContext();
  if (normalized.includes("100 trieu") || normalized.includes("phan bo") || normalized.includes("cat giam chi phi marketing") || normalized.includes("giam 20% ngan sach") || normalized.includes("giam 20 ngan sach") || normalized.includes("nen dung") || (normalized.includes("roi") && !normalized.includes("roi bo"))) return marketingBudgetContext();
  if (mentionsCampaign && !normalized.includes("kem hon trung binh") && !normalized.includes("vuot ky vong") && !normalized.includes("hieu suat marketing giua cac thang")) return campaignContext(question);
  if (normalized.includes("10 khach") || normalized.includes("gia tri nhat") || normalized.includes("mua lai") || normalized.includes("lau roi chua quay lai") || normalized.includes("giam muc chi tieu") || normalized.includes("loyalty") || normalized.includes("khach hang moi hay khach hang cu") || normalized.includes("giu chan khach hang") || normalized.includes("phan nhom khach")) return customerIntelligenceContext();
  if (normalized.includes("khach") || normalized.includes("segment") || normalized.includes("vip") || normalized.includes("returning") || normalized.includes("cham soc")) return customerContext();
  if (normalized.includes("benchmark") || normalized.includes("quy nay") || normalized.includes("quy truoc") || normalized.includes("vuot ky vong") || normalized.includes("kem hon trung binh") || normalized.includes("hieu suat marketing giua cac thang") || normalized.includes("ty le tang truong tot nhat")) return benchmarkContext();
  if (normalized.includes("conversion rate") || normalized.includes("funnel") || normalized.includes("mat khach") || normalized.includes("khach quan tam") || normalized.includes("gia san pham") || normalized.includes("bundle") || normalized.includes("nhan vien")) return salesOptimizationContext();
  if (normalized.includes("nhap them") || normalized.includes("ban cham") || normalized.includes("nhu cau tang") || normalized.includes("nguy co ton kho") || normalized.includes("uu tien quang ba") || normalized.includes("doanh thu cao nhung tang truong cham")) return inventoryManagementContext();
  if (normalized.includes("chien luoc") || normalized.includes("3 van de lon") || normalized.includes("tap trung tang truong") || normalized.includes("mo rong thi truong") || normalized.includes("toi uu san pham") || normalized.includes("tuong lai") || normalized.includes("90 ngay")) return strategyContext();
  if (normalized.includes("du doan") || normalized.includes("cuoi nam") || normalized.includes("xu huong khach hang trong 3 thang") || normalized.includes("roi tot nhat")) return predictionContext();
  if ((normalized.includes("nguyen nhan") && (normalized.includes("tung cap") || normalized.includes("khach hang") || normalized.includes("san pham") || normalized.includes("kenh ban") || normalized.includes("10%"))) || normalized.includes("tai sao doanh thu thang nay giam") || normalized.includes("yeu to nao anh huong") || normalized.includes("keo doanh thu") || normalized.includes("anh huong tieu cuc")) return advancedRootCauseContext();
  if (normalized.includes("tang doanh thu 20") || normalized.includes("ke hoach tang truong") || normalized.includes("tang truong doanh thu trong 3 thang")) return growthPlanContext();
  if (normalized.includes("thang nao cao nhat") || normalized.includes("thang nao thap nhat") || normalized.includes("6 thang") || normalized.includes("xu huong doanh thu") || normalized.includes("doanh thu trung binh") || normalized.includes("toc do tang truong")) return revenueTrendContext();
  if (normalized.includes("doanh thu") && (normalized.includes("bao nhieu") || normalized.includes("%") || normalized.includes("phan tram") || normalized.includes("so voi thang truoc"))) return monthComparisonContext();
  if (normalized.includes("nguyen nhan doanh thu")) return driverContext();
  if (normalized.includes("doanh thu") && (normalized.includes("giam") || normalized.includes("tang") || normalized.includes("do don") || normalized.includes("aov"))) return driverContext();
  if (normalized.includes("tong quan") || normalized.includes("360") || normalized.includes("phan tich sau") || normalized.includes("buc tranh") || normalized.includes("suc khoe")) return businessReviewContext();
  if (normalized.includes("so sanh") || normalized.includes("best") || normalized.includes("worst") || normalized.includes("tot nhat") || normalized.includes("kem nhat")) return comparisonContext();
  if (normalized.includes("co nen") || normalized.includes("scale") || normalized.includes("quyet dinh") || normalized.includes("thu gi")) return decisionContext();
  if (normalized.includes("bat thuong") || normalized.includes("anomaly") || normalized.includes("canh bao") || normalized.includes("risk nao")) return anomalyContext();
  if (normalized.includes("du bao") || normalized.includes("forecast") || normalized.includes("thang toi")) return forecastContext();
  if (normalized.includes("what if") || normalized.includes("gia su") || normalized.includes("scenario") || normalized.includes("mo phong")) return scenarioContext();
  if (normalized.includes("root cause") || normalized.includes("nguyen nhan goc") || normalized.includes("vi sao")) return rootCauseContext();
  if (normalized.includes("data quality") || normalized.includes("du lieu sach") || normalized.includes("kiem tra du lieu")) return dataQualityContext();
  if (normalized.includes("loi nhuan") || normalized.includes("profit") || normalized.includes("margin")) return profitContext();
  if (normalized.includes("cohort") || normalized.includes("ltv") || normalized.includes("repeat") || normalized.includes("retention")) return cohortContext();
  if (normalized.includes("nen lam gi") || normalized.includes("uu tien") || normalized.includes("recommend") || normalized.includes("de xuat")) return recommendationContext();
  if (normalized.includes("driver") || normalized.includes("do don") || normalized.includes("aov")) return driverContext();
  if (mentionsCampaign || normalized.includes("cac")) return campaignContext(question);
  if (normalized.includes("khach") || normalized.includes("segment") || normalized.includes("vip") || normalized.includes("returning")) return customerContext();
  if (normalized.includes("san pham") || normalized.includes("product") || normalized.includes("ton kho") || normalized.includes("return")) return productContext();
  return channelContext(question) ?? revenueContext();
}

export function fallbackInsight(question: string): InsightResponse {
  const context = buildInsightContext(question);
  return {
    answer: `${context.summary}\nĐộ tin cậy: ${context.confidence}.`,
    evidence: context.evidence,
    actions: context.actions,
    source: "fallback",
    limitations: "Phân tích này chạy trực tiếp trên dữ liệu demo trong máy, không cần API key.",
    followUps: context.followUps,
    insightType: context.type
  };
}

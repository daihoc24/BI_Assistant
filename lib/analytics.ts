import { channelMarketing, demoCampaigns, demoCustomers, demoInventory, demoReturns } from "./data/seed";
import { getOrders } from "./data/repository";
import type { Anomaly, Breakdown, CampaignDiagnostic, ChannelDiagnostic, CohortDiagnostic, DashboardResponse, DataQualityCheck, ForecastPoint, Order, ProductRisk, ProfitDiagnostic, Recommendation, RevenueDriver, RootCause, SegmentDiagnostic, TrendPoint, WhatIfScenario } from "./types";

export const lineRevenue = (quantity: number, unitPrice: number, discount: number) => quantity * unitPrice * (1 - discount);
export const completed = (orders: Order[]) => orders.filter((order) => order.status === "completed");
export const revenueOf = (orders: Order[]) => completed(orders).flatMap((order) => order.lines).reduce((total, line) => total + lineRevenue(line.quantity, line.unitPrice, line.discount), 0);
export const aovOf = (orders: Order[]) => { const valid = completed(orders); return valid.length === 0 ? 0 : revenueOf(valid) / valid.length; };

const byMonth = (prefix: string) => getOrders().filter((order) => order.date.startsWith(prefix));
const monthLabel = (prefix: string) => `Tháng ${Number(prefix.slice(5, 7))}`;

const aggregate = (orders: Order[], key: "channel" | "product" | "category") => {
  const rows = new Map<string, Breakdown>();
  completed(orders).forEach((order) => order.lines.forEach((line) => {
    const name = key === "channel" ? order.channel : key === "product" ? line.product : line.category;
    const old = rows.get(name) ?? { name, revenue: 0, orders: 0 };
    old.revenue += lineRevenue(line.quantity, line.unitPrice, line.discount);
    old.orders += 1;
    rows.set(name, old);
  }));
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
};

function channelDiagnostics(current: Order[]): ChannelDiagnostic[] {
  const totalRevenue = revenueOf(current);
  const channelRows = aggregate(current, "channel");
  return channelRows.map((channel) => {
    const marketing = channelMarketing.find(item => item.channel === channel.name);
    const traffic = marketing?.traffic ?? 0;
    const spend = marketing?.spend ?? 0;
    const completedOrders = completed(current).filter(order => order.channel === channel.name).length;
    const conversionRate = traffic === 0 ? 0 : completedOrders / traffic;
    return {
      ...channel,
      traffic,
      spend,
      conversionRate,
      cac: completedOrders === 0 ? 0 : spend / completedOrders,
      aov: completedOrders === 0 ? 0 : channel.revenue / completedOrders,
      revenueShare: totalRevenue === 0 ? 0 : channel.revenue / totalRevenue
    };
  });
}

function segmentDiagnostics(current: Order[]): SegmentDiagnostic[] {
  const rows = new Map<string, SegmentDiagnostic>();
  const returnsByOrder = new Set(demoReturns.map(item => item.orderId));
  completed(current).forEach((order) => {
    const customer = demoCustomers.find(item => item.id === order.customerId);
    const name = customer?.segment ?? "Unknown";
    const old = rows.get(name) ?? { name, revenue: 0, orders: 0, customers: 0, aov: 0, returnRate: 0 };
    old.revenue += order.lines.reduce((sum, line) => sum + lineRevenue(line.quantity, line.unitPrice, line.discount), 0);
    old.orders += 1;
    old.customers += rows.has(`${name}:${order.customerId}`) ? 0 : 1;
    old.returnRate += returnsByOrder.has(order.id) ? 1 : 0;
    rows.set(`${name}:${order.customerId}`, old);
    rows.set(name, old);
  });
  return [...rows.entries()]
    .filter(([key]) => !key.includes(":"))
    .map(([, row]) => ({ ...row, aov: row.orders === 0 ? 0 : row.revenue / row.orders, returnRate: row.orders === 0 ? 0 : row.returnRate / row.orders }))
    .sort((a, b) => b.revenue - a.revenue);
}

function productRisks(current: Order[]): ProductRisk[] {
  const productRows = aggregate(current, "product");
  return productRows.map((product) => {
    const inventory = demoInventory.find(item => item.product === product.name);
    const productIds = completed(current).flatMap(order => order.lines).filter(line => line.product === product.name).map(line => line.productId);
    const returned = demoReturns.filter(item => productIds.includes(item.productId)).length;
    const returnRate = product.orders === 0 ? 0 : returned / product.orders;
    const stock = inventory?.stock ?? 0;
    const reorderPoint = inventory?.reorderPoint ?? 0;
    const risk: ProductRisk["risk"] = stock <= reorderPoint || returnRate > 0.16 ? "High" : stock <= reorderPoint * 1.5 || returnRate > 0.09 ? "Medium" : "Low";
    return { ...product, stock, reorderPoint, returnRate, risk };
  }).sort((a, b) => (b.risk === "High" ? 1 : 0) - (a.risk === "High" ? 1 : 0) || b.revenue - a.revenue);
}

function campaignDiagnostics(current: Order[]): CampaignDiagnostic[] {
  const revenueByChannel = aggregate(current, "channel");
  return demoCampaigns.map((campaign) => {
    const attributedRevenue = revenueByChannel.find(item => item.name === campaign.channel)?.revenue ?? 0;
    return {
      name: campaign.name,
      channel: campaign.channel,
      spend: campaign.spend,
      clicks: campaign.clicks,
      cpc: campaign.clicks === 0 ? 0 : campaign.spend / campaign.clicks,
      attributedRevenue,
      roas: campaign.spend === 0 ? 0 : attributedRevenue / campaign.spend
    };
  }).sort((a, b) => b.roas - a.roas);
}

function revenueDrivers(current: Order[], previous: Order[]): RevenueDriver[] {
  const currentOrders = completed(current).length;
  const previousOrders = completed(previous).length;
  const currentAov = aovOf(current);
  const previousAov = aovOf(previous);
  const drivers: RevenueDriver[] = [
    { name: "Orders", current: currentOrders, previous: previousOrders, change: currentOrders - previousOrders, impact: (currentOrders - previousOrders) * previousAov },
    { name: "AOV", current: currentAov, previous: previousAov, change: currentAov - previousAov, impact: currentOrders * (currentAov - previousAov) }
  ];
  return drivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

function profitDiagnostic(current: Order[]): ProfitDiagnostic {
  const grossRevenue = revenueOf(current);
  const marketingSpend = demoCampaigns.reduce((sum, campaign) => campaign.month === "2026-07" ? sum + campaign.spend : sum, 0);
  const currentOrderIds = new Set(current.map(order => order.id));
  const returnCost = demoReturns.filter(item => currentOrderIds.has(item.orderId)).reduce((sum, item) => sum + item.cost, 0);
  const estimatedGrossMargin = grossRevenue * 0.42;
  const contributionProfit = estimatedGrossMargin - marketingSpend - returnCost;
  return { grossRevenue, marketingSpend, returnCost, estimatedGrossMargin, contributionProfit, marginRate: grossRevenue === 0 ? 0 : contributionProfit / grossRevenue };
}

function cohortDiagnostics(current: Order[]): CohortDiagnostic[] {
  return segmentDiagnostics(current).map(segment => {
    const customers = demoCustomers.filter(customer => customer.segment === segment.name);
    const repeatCustomers = customers.filter(customer => completed(current).filter(order => order.customerId === customer.id).length > 1).length;
    const repeatRate = customers.length === 0 ? 0 : repeatCustomers / customers.length;
    const avgLifetimeValue = customers.length === 0 ? 0 : customers.reduce((sum, customer) => sum + customer.lifetimeValue, 0) / customers.length;
    const risk: CohortDiagnostic["risk"] = segment.returnRate > 0.18 || repeatRate < 0.08 ? "High" : segment.returnRate > 0.1 || repeatRate < 0.14 ? "Medium" : "Low";
    return { segment: segment.name as CohortDiagnostic["segment"], customers: segment.customers, repeatRate, avgLifetimeValue, risk };
  }).sort((a, b) => b.avgLifetimeValue - a.avgLifetimeValue);
}

function anomalies(channels: ChannelDiagnostic[], products: ProductRisk[], campaigns: CampaignDiagnostic[], profit: ProfitDiagnostic): Anomaly[] {
  const worstConversion = [...channels].sort((a, b) => a.conversionRate - b.conversionRate)[0];
  const highRiskProduct = products.find(product => product.risk === "High");
  const poorCampaign = [...campaigns].sort((a, b) => a.roas - b.roas)[0];
  return [
    ...(worstConversion ? [{ area: `Kênh ${worstConversion.name}`, severity: "Medium" as const, signal: `Conversion chỉ ${(worstConversion.conversionRate * 100).toFixed(2)}% với CAC ${Math.round(worstConversion.cac).toLocaleString("vi-VN")} ₫`, recommendation: "Kiểm tra landing page, offer và chất lượng traffic." }] : []),
    ...(highRiskProduct ? [{ area: `Sản phẩm ${highRiskProduct.name}`, severity: "High" as const, signal: `Risk ${highRiskProduct.risk}, tồn ${highRiskProduct.stock}, return ${(highRiskProduct.returnRate * 100).toFixed(1)}%`, recommendation: "Ưu tiên kiểm tra tồn kho và nguyên nhân trả hàng." }] : []),
    ...(poorCampaign ? [{ area: `Campaign ${poorCampaign.name}`, severity: poorCampaign.roas < 1 ? "High" as const : "Medium" as const, signal: `ROAS ${poorCampaign.roas.toFixed(2)}x, CPC ${Math.round(poorCampaign.cpc).toLocaleString("vi-VN")} ₫`, recommendation: "Giảm scale hoặc test lại creative/offer." }] : []),
    ...(profit.marginRate < 0 ? [{ area: "Lợi nhuận đóng góp", severity: "High" as const, signal: `Contribution margin ${(profit.marginRate * 100).toFixed(1)}%`, recommendation: "Cắt spend kém hiệu quả và giảm return cost trước khi scale." }] : [])
  ];
}

function recommendations(drivers: RevenueDriver[], issues: Anomaly[], profit: ProfitDiagnostic): Recommendation[] {
  const biggestDriver = drivers[0];
  return [
    { priority: "High", area: "Revenue driver", action: `${biggestDriver.name === "Orders" ? "Khôi phục volume đơn hàng" : "Tăng AOV"} vì đây là driver tác động lớn nhất.`, expectedImpact: `${Math.round(biggestDriver.impact).toLocaleString("vi-VN")} ₫ ảnh hưởng ước tính` },
    ...issues.slice(0, 2).map(issue => ({ priority: issue.severity === "High" ? "High" as const : "Medium" as const, area: issue.area, action: issue.recommendation, expectedImpact: issue.signal })),
    { priority: profit.marginRate < 0 ? "High" : "Medium", area: "Profit", action: "Theo dõi contribution profit thay vì chỉ doanh thu.", expectedImpact: `Margin hiện tại ${(profit.marginRate * 100).toFixed(1)}%` }
  ];
}

function forecast(trend: TrendPoint[]): ForecastPoint[] {
  const last = trend[trend.length - 1];
  const previous = trend[trend.length - 2] ?? last;
  const slope = last.revenue - previous.revenue;
  return [1, 2, 3].map((step) => {
    const projected = Math.max(0, last.revenue + slope * step * 0.65);
    const band = projected * (0.12 + step * 0.04);
    return { label: `T+${step}`, revenue: projected, lowerBound: Math.max(0, projected - band), upperBound: projected + band, confidence: step === 1 ? "Medium" : "Low" };
  });
}

function whatIfScenarios(channels: ChannelDiagnostic[], campaigns: CampaignDiagnostic[], profit: ProfitDiagnostic): WhatIfScenario[] {
  const worstCampaign = [...campaigns].sort((a, b) => a.roas - b.roas)[0];
  const bestChannel = [...channels].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const highCacChannel = [...channels].sort((a, b) => b.cac - a.cac)[0];
  const scenarios: WhatIfScenario[] = [
    { name: "Shift spend to efficient channel", assumption: `Chuyển 15% spend từ ${worstCampaign.channel} sang ${bestChannel.name}`, revenueDelta: bestChannel.aov * 8, profitDelta: bestChannel.aov * 8 * 0.42, risk: "Medium" },
    { name: "Reduce high CAC leakage", assumption: `Giảm 10% CAC ở ${highCacChannel.name}`, revenueDelta: 0, profitDelta: highCacChannel.spend * 0.1, risk: "Low" },
    { name: "Return-rate cleanup", assumption: "Giảm 20% return cost ở nhóm sản phẩm rủi ro", revenueDelta: 0, profitDelta: profit.returnCost * 0.2, risk: "Low" }
  ];
  return scenarios.sort((a, b) => b.profitDelta - a.profitDelta);
}

function rootCauses(drivers: RevenueDriver[], channels: ChannelDiagnostic[], products: ProductRisk[], campaigns: CampaignDiagnostic[], profit: ProfitDiagnostic): RootCause[] {
  const worstChannel = [...channels].sort((a, b) => a.conversionRate - b.conversionRate)[0];
  const riskyProduct = products.find(product => product.risk === "High") ?? products[0];
  const poorCampaign = [...campaigns].sort((a, b) => a.roas - b.roas)[0];
  const causes: RootCause[] = [
    { rank: 1, factor: `Revenue driver: ${drivers[0].name}`, impact: drivers[0].impact, confidence: "High", evidence: `Driver impact ${Math.round(drivers[0].impact).toLocaleString("vi-VN")} ₫` },
    { rank: 2, factor: `Channel conversion: ${worstChannel.name}`, impact: -worstChannel.cac, confidence: "Medium", evidence: `CR ${(worstChannel.conversionRate * 100).toFixed(2)}%, CAC ${Math.round(worstChannel.cac).toLocaleString("vi-VN")} ₫` },
    { rank: 3, factor: `Campaign efficiency: ${poorCampaign.name}`, impact: poorCampaign.attributedRevenue - poorCampaign.spend, confidence: "Medium", evidence: `ROAS ${poorCampaign.roas.toFixed(2)}x` },
    { rank: 4, factor: `Product ops risk: ${riskyProduct.name}`, impact: -riskyProduct.returnRate * riskyProduct.revenue, confidence: "Medium", evidence: `Return ${(riskyProduct.returnRate * 100).toFixed(1)}%, stock ${riskyProduct.stock}` },
    { rank: 5, factor: "Contribution profit", impact: profit.contributionProfit, confidence: "Medium", evidence: `Margin ${(profit.marginRate * 100).toFixed(1)}%` }
  ];
  return causes.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).map((item, index) => ({ ...item, rank: index + 1 }));
}

function dataQuality(current: Order[]): DataQualityCheck[] {
  const allLines = current.flatMap(order => order.lines.map(line => ({ order, line })));
  const missingCustomer = current.filter(order => !demoCustomers.some(customer => customer.id === order.customerId)).length;
  const missingInventory = allLines.filter(({ line }) => !demoInventory.some(item => item.productId === line.productId)).length;
  const invalidDiscount = allLines.filter(({ line }) => line.discount < 0 || line.discount > 0.7).length;
  const orphanReturns = demoReturns.filter(item => !current.some(order => order.id === item.orderId) && item.orderId.startsWith("ORD-7")).length;
  return [
    { area: "Customer join", status: missingCustomer === 0 ? "Pass" : "Warn", issue: missingCustomer === 0 ? "Tất cả order join được customer." : "Có order thiếu customer profile.", affectedRows: missingCustomer },
    { area: "Inventory join", status: missingInventory === 0 ? "Pass" : "Warn", issue: missingInventory === 0 ? "Tất cả line item join được inventory." : "Có product thiếu inventory snapshot.", affectedRows: missingInventory },
    { area: "Discount sanity", status: invalidDiscount === 0 ? "Pass" : "Fail", issue: invalidDiscount === 0 ? "Discount trong ngưỡng hợp lệ." : "Có discount ngoài ngưỡng.", affectedRows: invalidDiscount },
    { area: "Returns integrity", status: orphanReturns === 0 ? "Pass" : "Warn", issue: orphanReturns === 0 ? "Return records khớp order hiện tại." : "Có return record không khớp order kỳ này.", affectedRows: orphanReturns }
  ];
}

export function getDashboard(): DashboardResponse {
  const months = ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
  const current = byMonth("2026-07");
  const previous = byMonth("2026-06");
  const currentCompleted = completed(current);
  const previousCompleted = completed(previous);
  const metric = (label: string, value: number, before: number, format: "currency" | "number") => ({ label, value, previous: before, change: before === 0 ? null : ((value - before) / before) * 100, format });
  const trend: TrendPoint[] = months.map(month => {
    const rows = byMonth(month);
    return { label: monthLabel(month), revenue: revenueOf(rows), orders: completed(rows).length };
  });
  const channelRows = channelDiagnostics(current);
  const productRows = productRisks(current);
  const campaignRows = campaignDiagnostics(current);
  const drivers = revenueDrivers(current, previous);
  const profit = profitDiagnostic(current);
  const issueRows = anomalies(channelRows, productRows, campaignRows, profit);
  const forecastRows = forecast(trend);

  return {
    periodLabel: "01-18 Tháng 7, 2026",
    kpis: [
      metric("Doanh thu", revenueOf(current), revenueOf(previous), "currency"),
      metric("Đơn hàng", currentCompleted.length, previousCompleted.length, "number"),
      metric("Giá trị đơn TB", aovOf(current), aovOf(previous), "currency"),
      metric("Khách hàng", new Set(currentCompleted.map((o) => o.customerId)).size, new Set(previousCompleted.map((o) => o.customerId)).size, "number")
    ],
    trend,
    channels: aggregate(current, "channel"),
    products: aggregate(current, "product"),
    categories: aggregate(current, "category"),
    channelDiagnostics: channelRows,
    segmentDiagnostics: segmentDiagnostics(current),
    productRisks: productRows,
    campaignDiagnostics: campaignRows,
    revenueDrivers: drivers,
    anomalies: issueRows,
    profit,
    cohorts: cohortDiagnostics(current),
    recommendations: recommendations(drivers, issueRows, profit),
    forecast: forecastRows,
    whatIfScenarios: whatIfScenarios(channelRows, campaignRows, profit),
    rootCauses: rootCauses(drivers, channelRows, productRows, campaignRows, profit),
    dataQuality: dataQuality(current)
  };
}

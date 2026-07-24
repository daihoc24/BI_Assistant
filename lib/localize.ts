import type { Evidence, InsightResponse } from "./types";

const insightTypeLabels: Record<string, string> = {
  "Channel diagnostic": "Chẩn đoán kênh bán",
  "Product and operations risk": "Rủi ro sản phẩm và vận hành",
  "Customer segment analysis": "Phân tích phân khúc khách hàng",
  "Campaign efficiency": "Hiệu quả chiến dịch",
  "Revenue health": "Sức khỏe doanh thu",
  "Anomaly scan": "Quét tín hiệu bất thường",
  "Contribution profit": "Lợi nhuận đóng góp",
  "Cohort and retention": "Nhóm khách theo kỳ và giữ chân",
  "Executive recommendation": "Đề xuất điều hành",
  "Forecast": "Dự báo doanh thu",
  "What-if scenario": "Kịch bản giả định",
  "Root cause ranking": "Xếp hạng nguyên nhân gốc",
  "Data quality": "Chất lượng dữ liệu",
  "360 business review": "Tổng quan kinh doanh 360",
  "Best versus worst comparison": "So sánh điểm mạnh và điểm yếu",
  "Decision support": "Hỗ trợ ra quyết định",
  "Customer intelligence": "Phân tích khách hàng",
  "Customer churn": "Nguy cơ khách hàng rời bỏ",
  "Phân tích kịch bản what-if": "Phân tích kịch bản giả định"
};

const replacements: Array<[RegExp, string]> = [
  [/\bCampaign\b/g, "Chiến dịch"],
  [/\bcampaign\b/g, "chiến dịch"],
  [/\bChannel\b/g, "Kênh bán"],
  [/\bchannel\b/g, "kênh bán"],
  [/\bconversion rate\b/gi, "tỷ lệ chuyển đổi"],
  [/\bconversion\b/gi, "chuyển đổi"],
  [/\btraffic\b/gi, "lượt truy cập"],
  [/\bspend\b/gi, "chi phí"],
  [/\bscale\b/gi, "tăng ngân sách"],
  [/\bcreative\b/gi, "nội dung quảng cáo"],
  [/\boffer\b/gi, "ưu đãi"],
  [/\bbenchmark\b/gi, "mốc so sánh"],
  [/\brevenue\b/gi, "doanh thu"],
  [/\bprofit\b/gi, "lợi nhuận"],
  [/\bmargin\b/gi, "biên lợi nhuận"],
  [/\bforecast\b/gi, "dự báo"],
  [/\bwhat-if\b/gi, "kịch bản giả định"],
  [/\bscenario\b/gi, "kịch bản"],
  [/\broot cause\b/gi, "nguyên nhân gốc"],
  [/\bdriver\b/gi, "yếu tố tác động"],
  [/\banomaly\b/gi, "tín hiệu bất thường"],
  [/\bcohort\b/gi, "nhóm khách theo kỳ"],
  [/\bretention\b/gi, "giữ chân khách hàng"],
  [/\breturn rate\b/gi, "tỷ lệ trả hàng"],
  [/\breturn cost\b/gi, "chi phí trả hàng"],
  [/\bROAS\b/g, "hiệu quả quảng cáo"],
  [/\bCAC\b/g, "chi phí/đơn"],
  [/\bCPC\b/g, "chi phí mỗi nhấp"],
  [/\bAOV\b/g, "giá trị đơn TB"],
  [/\bCR\b/g, "chuyển đổi"],
  [/\bOrders\b/g, "Số đơn"],
  [/\bWebsite\b/g, "Website"],
  [/\bMarketplace\b/g, "Sàn TMĐT"],
  [/\bSocial\b/g, "Mạng xã hội"],
  [/\bAffiliate\b/g, "Tiếp thị liên kết"],
  [/\bReturning\b/g, "Khách quay lại"],
  [/\bNew\b/g, "Khách mới"],
  [/\bAt Risk\b/g, "Có nguy cơ rời bỏ"],
  [/\bLow\b/g, "Thấp"],
  [/\bMedium\b/g, "Trung bình"],
  [/\bHigh\b/g, "Cao"]
];

function localizeText(value: string) {
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

function localizeEvidence(item: Evidence): Evidence {
  return {
    ...item,
    metric: localizeText(item.metric),
    value: localizeText(item.value),
    explanation: localizeText(item.explanation)
  };
}

export function localizeInsightResponse(response: InsightResponse): InsightResponse {
  return {
    ...response,
    answer: localizeText(response.answer),
    evidence: response.evidence.map(localizeEvidence),
    actions: response.actions.map(localizeText),
    limitations: response.limitations ? localizeText(response.limitations) : undefined,
    followUps: response.followUps?.map(localizeText),
    insightType: response.insightType ? insightTypeLabels[response.insightType] ?? localizeText(response.insightType) : undefined
  };
}

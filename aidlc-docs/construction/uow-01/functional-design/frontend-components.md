# Thành phần frontend

## Cây component

```text
DashboardPage
  DashboardHeader
  KpiGrid
    KpiCard
  RevenueTrendChart
  BreakdownChart
  HighlightsTable
  AssistantPanel
    SuggestedQuestions
    Conversation
    QuestionComposer
    InsightEvidence
    RecommendedActions
```

## State và tương tác

- `DashboardPage`: dashboard data, loading, error, retry.
- `AssistantPanel`: messages, question input, request status, error.
- `QuestionComposer`: text hợp lệ, giới hạn độ dài, disabled khi đang gửi.
- `SuggestedQuestions`: gửi câu hỏi đã chọn qua cùng luồng với input tự do.

## API integration

| Component | Endpoint | Kết quả |
|---|---|---|
| DashboardPage | `GET /api/dashboard` | KPI, trends, breakdowns |
| AssistantPanel | `POST /api/assistant/ask` | InsightResponse có evidence/actions |

## Quy tắc UI

- Hiển thị loading skeleton hoặc trạng thái rõ ràng.
- Bất kỳ lỗi nào đều có thông báo an toàn và nút thử lại.
- Biểu đồ/bảng có label và phương án hiển thị text thay thế phù hợp.
- Không hiển thị API key, lỗi nội bộ hoặc raw prompt/context.

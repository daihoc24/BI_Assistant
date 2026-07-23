# Interface và phương thức cấp cao

Các chữ ký dưới đây mô tả hợp đồng cấp cao bằng TypeScript; business rule chi tiết sẽ được quyết định trong Functional Design.

## API Controllers

```ts
type DashboardResponse = { kpis: KpiCard[]; trends: TrendPoint[]; breakdowns: Breakdown[] };
type AskRequest = { question: string; conversationId?: string };
type InsightResponse = { answer: string; evidence: Evidence[]; actions: RecommendedAction[]; source: "llm" | "fallback" };

getDashboard(): Promise<DashboardResponse>
askAssistant(request: AskRequest): Promise<InsightResponse>
```

## Dashboard Service

```ts
getOverview(period?: DateRange): Promise<DashboardResponse>
```

## Analytics Service

```ts
getKpis(period: DateRange): Promise<KpiSummary>
getRevenueTrend(period: DateRange, granularity: "day" | "month"): Promise<TrendPoint[]>
getBreakdown(dimension: "category" | "channel" | "product" | "region", period: DateRange): Promise<Breakdown[]>
comparePeriods(current: DateRange, previous: DateRange): Promise<PeriodComparison>
```

## Insight Orchestrator

```ts
answerQuestion(question: string, context?: ConversationContext): Promise<InsightResponse>
classifySupportedIntent(question: string): SupportedIntent | "unsupported"
buildEvidence(intent: SupportedIntent): Promise<Evidence[]>
```

## AI Provider Adapter và Fallback Insight Engine

```ts
generateAnswer(input: GroundedPrompt): Promise<string>
generateFallback(intent: SupportedIntent, evidence: Evidence[]): InsightResponse
```

## Data Repository

```ts
listOrders(filter: OrderFilter): Promise<Order[]>
listProducts(): Promise<Product[]>
getAggregates(query: AggregateQuery): Promise<AggregateRow[]>
seedDemoData(): Promise<void>
```

## Validation và Configuration

```ts
parseAskRequest(input: unknown): AskRequest
getServerConfig(): ServerConfig
```

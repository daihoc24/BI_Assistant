import type { Campaign, Channel, Customer, CustomerSegment, InventorySnapshot, Order, OrderLine, ReturnRecord } from "../types";

type ProductSeed = { productId: string; product: string; category: string; unitPrice: number; weight: number };

const products: ProductSeed[] = [
  { productId: "P-01", product: "Tai nghe Wave Pro", category: "Điện tử", unitPrice: 1450000, weight: 15 },
  { productId: "P-02", product: "Bình nước Urban", category: "Lifestyle", unitPrice: 280000, weight: 18 },
  { productId: "P-03", product: "Bàn phím Mini", category: "Điện tử", unitPrice: 890000, weight: 12 },
  { productId: "P-04", product: "Đèn bàn Halo", category: "Nhà cửa", unitPrice: 520000, weight: 11 },
  { productId: "P-05", product: "Balo Metro", category: "Lifestyle", unitPrice: 740000, weight: 10 },
  { productId: "P-06", product: "Máy lọc không khí Desk", category: "Nhà cửa", unitPrice: 1890000, weight: 7 },
  { productId: "P-07", product: "Chuột Aero Silent", category: "Điện tử", unitPrice: 420000, weight: 14 },
  { productId: "P-08", product: "Sổ tay Focus", category: "Văn phòng", unitPrice: 160000, weight: 16 }
];

export const productCatalog = products;

const channelProfiles: Record<Channel, { weight: number; discount: number; cancellation: number }> = {
  Website: { weight: 30, discount: 0.07, cancellation: 0.04 },
  Marketplace: { weight: 28, discount: 0.12, cancellation: 0.08 },
  Social: { weight: 14, discount: 0.18, cancellation: 0.13 },
  Email: { weight: 16, discount: 0.05, cancellation: 0.03 },
  Affiliate: { weight: 12, discount: 0.1, cancellation: 0.06 }
};

export const channelMarketing = [
  { channel: "Website" as const, traffic: 42000, spend: 38_000_000 },
  { channel: "Marketplace" as const, traffic: 51000, spend: 51_000_000 },
  { channel: "Social" as const, traffic: 68000, spend: 64_000_000 },
  { channel: "Email" as const, traffic: 18000, spend: 8_000_000 },
  { channel: "Affiliate" as const, traffic: 24000, spend: 19_000_000 }
];

const segments: CustomerSegment[] = ["New", "Returning", "VIP", "At Risk"];
const regions: Customer["region"][] = ["North", "Central", "South"];

export const demoCustomers: Customer[] = Array.from({ length: 160 }, (_, index) => {
  const id = `C-${String(index).padStart(3, "0")}`;
  const segment = segments[(index * 7) % segments.length];
  const acquisitionChannel = Object.keys(channelProfiles)[(index * 11) % Object.keys(channelProfiles).length] as Channel;
  return {
    id,
    segment,
    region: regions[(index * 5) % regions.length],
    acquisitionChannel,
    lifetimeValue: 450_000 + ((index * 137_000) % 8_500_000)
  };
});

export const demoCampaigns: Campaign[] = [
  { id: "CMP-01", name: "Search Always On", channel: "Website", month: "2026-07", spend: 19_000_000, impressions: 240_000, clicks: 16_800 },
  { id: "CMP-02", name: "Marketplace Mega Day", channel: "Marketplace", month: "2026-07", spend: 31_000_000, impressions: 410_000, clicks: 22_600 },
  { id: "CMP-03", name: "Social Short Video", channel: "Social", month: "2026-07", spend: 42_000_000, impressions: 890_000, clicks: 27_200 },
  { id: "CMP-04", name: "VIP Email Drop", channel: "Email", month: "2026-07", spend: 4_500_000, impressions: 62_000, clicks: 8_900 },
  { id: "CMP-05", name: "Creator Affiliate Push", channel: "Affiliate", month: "2026-07", spend: 12_000_000, impressions: 190_000, clicks: 9_700 }
];

export const demoInventory: InventorySnapshot[] = products.map((product, index) => ({
  productId: product.productId,
  product: product.product,
  stock: 24 + ((index * 17) % 130),
  reorderPoint: 35 + ((index * 9) % 45),
  leadTimeDays: 4 + ((index * 3) % 12)
}));

function weightedPick<T extends { weight: number }>(items: T[], seed: number) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = seed % total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor < 0) return item;
  }
  return items[0];
}

function channelPick(seed: number): Channel {
  return weightedPick(Object.entries(channelProfiles).map(([channel, profile]) => ({ channel: channel as Channel, weight: profile.weight })), seed).channel;
}

function line(seed: number, channel: Channel): OrderLine {
  const product = weightedPick(products, seed * 7 + 11);
  const profile = channelProfiles[channel];
  const quantity = (seed % 5) === 0 ? 2 : 1;
  const campaignDiscount = (seed % 17) === 0 ? 0.08 : 0;
  return {
    productId: product.productId,
    product: product.product,
    category: product.category,
    quantity,
    unitPrice: product.unitPrice,
    discount: Math.min(0.28, profile.discount + campaignDiscount)
  };
}

function makeOrder(index: number, month: number, day: number): Order {
  const channel = channelPick(index * 13 + month * 5 + day);
  const lineCount = index % 9 === 0 ? 2 : 1;
  const profile = channelProfiles[channel];
  return {
    id: `ORD-${month}${String(index).padStart(4, "0")}`,
    date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    customerId: `C-${String((index * 17 + day) % 160).padStart(3, "0")}`,
    channel,
    status: (index % Math.round(1 / profile.cancellation)) === 0 ? "cancelled" : "completed",
    lines: Array.from({ length: lineCount }, (_, lineIndex) => line(index + lineIndex * 19, channel))
  };
}

export const demoOrders: Order[] = [];

let orderIndex = 1000;
for (const month of [2, 3, 4, 5, 6, 7]) {
  const lastDay = month === 2 ? 28 : 30;
  const daysToGenerate = month === 7 ? 18 : lastDay;
  for (let day = 1; day <= daysToGenerate; day += 1) {
    const dailyVolume = 2 + ((day + month) % 4) + (month >= 5 ? 1 : 0);
    for (let count = 0; count < dailyVolume; count += 1) {
      demoOrders.push(makeOrder(orderIndex, month, day));
      orderIndex += 1;
    }
  }
}

const completedOrders = demoOrders.filter(order => order.status === "completed");
export const demoReturns: ReturnRecord[] = completedOrders
  .filter((order, index) => index % 11 === 0 || order.channel === "Social" && index % 7 === 0)
  .map((order, index) => {
    const firstLine = order.lines[0];
    const reasons: ReturnRecord["reason"][] = ["Defect", "Late delivery", "Wrong expectation", "Changed mind"];
    return {
      id: `RET-${String(index + 1).padStart(4, "0")}`,
      orderId: order.id,
      productId: firstLine.productId,
      reason: reasons[(index * 5) % reasons.length],
      cost: Math.round(firstLine.unitPrice * 0.18)
    };
  });

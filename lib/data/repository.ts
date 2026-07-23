import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { demoOrders } from "./seed";
import type { Order } from "../types";

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "insightpilot.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA busy_timeout = 10000;");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_date TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    lines_json TEXT NOT NULL
  ) STRICT;
`);

const count = db.prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number };
if (count.count < demoOrders.length) {
  const insert = db.prepare("INSERT OR IGNORE INTO orders (id, order_date, customer_id, channel, status, lines_json) VALUES (?, ?, ?, ?, ?, ?)");
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const order of demoOrders) insert.run(order.id, order.date, order.customerId, order.channel, order.status, JSON.stringify(order.lines));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getOrders(): Order[] {
  const rows = db.prepare("SELECT id, order_date, customer_id, channel, status, lines_json FROM orders ORDER BY order_date").all() as Array<{ id: string; order_date: string; customer_id: string; channel: Order["channel"]; status: Order["status"]; lines_json: string }>;
  return rows.map((row) => ({ id: row.id, date: row.order_date, customerId: row.customer_id, channel: row.channel, status: row.status, lines: JSON.parse(row.lines_json) }));
}

import { NextResponse } from "next/server";
import { getOrders } from "../../../lib/data/repository";
import { log, requestId } from "../../../lib/security";

export async function GET() {
  const id = requestId();
  try {
    const orderCount = getOrders().length;
    return NextResponse.json({ status: "ok", dataSource: "sqlite", orderCount, timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store", "X-Request-ID": id } });
  } catch {
    log("error", "healthcheck_failed", { requestId: id });
    return NextResponse.json({ status: "unavailable", requestId: id }, { status: 503 });
  }
}

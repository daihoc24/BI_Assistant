import { NextResponse } from "next/server";
import { getDashboard } from "../../../lib/analytics";
import { log, requestId } from "../../../lib/security";

export async function GET() {
  const id = requestId();
  try { const data = getDashboard(); log("info", "dashboard_served", { requestId: id }); return NextResponse.json(data, { headers: { "X-Request-ID": id } }); }
  catch { log("error", "dashboard_failed", { requestId: id }); return NextResponse.json({ error: "Không thể tải dashboard. Vui lòng thử lại.", requestId: id }, { status: 500 }); }
}

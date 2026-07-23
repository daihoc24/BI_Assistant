import { NextResponse } from "next/server";
import { requestId } from "../../../lib/security";

export async function GET() {
  const id = requestId();
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store", "X-Request-ID": id } }
  );
}

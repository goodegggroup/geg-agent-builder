import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "geg-app-starter",
    timestamp: new Date().toISOString(),
  });
}

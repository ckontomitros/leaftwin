// src/app/api/trefle/search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "mediterranean drought tolerant";
  const limit = searchParams.get("limit") || "20";
  const token = process.env.NEXT_PUBLIC_TREFLE_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "Trefle token missing" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://trefle.io/api/v1/plants/search?token=${token}&q=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Trefle API error" }, { status: res.status });
    }

    const data = await res.json();

    // Add CORS headers
    const response = NextResponse.json(data);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
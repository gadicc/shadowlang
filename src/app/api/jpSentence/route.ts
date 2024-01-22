import { NextResponse } from "next/server";
import processor from "./processor";

export async function POST(request: Request) {
  const text = await request.text();
  const result = await processor(text);
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import transcribeDbCache from "./transcribeDbCache";
// import transcript from "./1absolutebeginner_lesson1.json";

export async function POST(request: Request) {
  const { sha256, language }: { sha256: string; language: string } =
    await request.json();

  const result = await transcribeDbCache({ sha256, language });
  return NextResponse.json(result);
}

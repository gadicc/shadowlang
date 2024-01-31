import { NextResponse } from "next/server";
import transcript from "./1absolutebeginner_lesson1.json";

export async function POST(_request: Request) {
  // const { text, targetLang = "English", words } = await request.json();
  return NextResponse.json(transcript);
}

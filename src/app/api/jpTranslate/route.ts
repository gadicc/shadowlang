import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  const { text } = await request.json();

  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    messages: [
      {
        role: "user",
        content:
          "Given the following Japanese sentence, translate to English, but also provide a JSON map connecting the English expressions or parts of speech to their to their Japanese equivalents: " +
          text,
      },
    ],
    model: "gpt-3.5-turbo",
  };
  const chatCompletion: OpenAI.Chat.ChatCompletion =
    await openai.chat.completions.create(params);
  console.log(chatCompletion);

  const content = chatCompletion.choices[0].message.content || "";
  console.log(content);

  const match = content.match(/(\{\n[\s\S]*\n}\n)/);
  console.log(match);
  if (match) {
    const json = match[0].replace(/\n/g, "");
    const result = JSON.parse(json);
    console.log(result);
    return NextResponse.json(result);
  }

  return NextResponse.json(null);
}

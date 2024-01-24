import { NextResponse } from "next/server";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function openai() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

export async function POST(request: Request) {
  const { text, targetLang = "English", words } = await request.json();
  const systemContent = `
You are a helpful assistant for a Japanese language learner.
The user will give you a Japanese sentence, followed by a JSON
list of the word(s) / expressions in that sentence with their parts
of speech.  You should provide a translation of the sentence into
${targetLang}, and an array of the translated word(s) / expressions
with their closest matching word(s) / expressions from the original
Japanese sentence, or \`null\` if no close match exists, and any
punctuation following the translated part.  For example:

Japanese sentence: そうなんですか。日本語が上手いですね。

JSON list of words / expressions and parts of speech:

[{"word":"そうなんですか","pos":"exp"},{"word":"。","pos":"symbol"},{"word":"日本語","pos":"n"},{"word":"が","pos":"prt"},{"word":"上手い","pos":"adj-i"},{"word":"です","pos":"cop"},{"word":"ね","pos":"prt"},{"word":"。","pos":"symbol"}]

Expected response:

{
  "translation": "Is that so?  Your Japanese is good.",
  "parts": [
    {
      "text": "Is that so",
      "word": "そうなんですか",
      "punctuation": "? "
    },
    {
      "text": "Your",
      "word": null,
      "punctuation": " "
    },
    {
      "text": "Japanese",
      "word": "日本語",
      "punctuation": " "
    },
    {
      "text": "is",
      "word": "です",
      "punctuation": " "
    },
    {
      "word": "good",
      "original": "上手い",
      "punctuation": ", "
    },
    {
      "word": "isn't it",
      "original": "ね",
      "punctuation": "? "
    }
  ]
}
`;

  const userContent = `
Japanese sentence: ${text}

JSON list of words / expressions and parts of speech:

${JSON.stringify(words)}
`;

  console.log({ systemContent, userContent });

  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    model: "gpt-4-1106-preview",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
  };
  const chatCompletion: OpenAI.Chat.ChatCompletion =
    await openai().chat.completions.create(params);
  console.log(chatCompletion);

  const content = chatCompletion.choices[0].message.content || "";
  console.log(content);

  const result = JSON.parse(content);
  console.log(result);
  return NextResponse.json(result);
}

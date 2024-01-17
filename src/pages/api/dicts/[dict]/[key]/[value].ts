import type { NextRequest } from "next/server";
import { db } from "../../../../../api-lib/db";
import { GongoDocument } from "gongo-server-db-mongo/lib/collection";

export const config = {
  runtime: "edge",
  // regions: ['iad1'],
};

const jmdict = db.collection("jmdict");
const kanjidic = db.collection("kanjidic");

export default async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const dict = params.get("dict");
  const key = params.get("key");
  const value = params.get("value");

  if (!dict || !key || !value) {
    return new Response("Missing parameters", { status: 400 });
  }

  let result;
  if (dict === "jmdict") {
    const query: GongoDocument = {};
    if (key === "id") {
      query.id = value;
      result = await jmdict.findOne(query);
    } else if (key === "kana") {
      query["kana.text"] = value;
      result = await jmdict.find(query).toArray();
    } else if (key === "kanji") {
      query["kanji.text"] = value;
      result = await jmdict.find(query).toArray();
    } else return new Response("Not such key: " + key, { status: 404 });
  } else if (dict === "kanjidic") {
    const query: GongoDocument = {};
    if (key === "literal") {
      query["literal"] = value;
      result = await kanjidic.find(query).toArray();
    } else return new Response("Not such key: " + key, { status: 404 });
  } else {
    new Response("Not such dictionary: " + dict, { status: 404 });
  }

  // Including `null` result.
  return new Response(JSON.stringify(result), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=86400",
    },
  });
}

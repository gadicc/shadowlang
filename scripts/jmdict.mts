import { loadDictionary } from "@scriptin/jmdict-simplified-loader";
import { db } from "../src/api-lib/db-full.js";

const dicts = [
  {
    type: "jmdict" as const,
    src: "../src/assets/jmdict-eng-3.5.0.json",
    coll: db.collection("jmdict"),
  },
  /*
  {
    type: "jmnedict" as const,
    src: "../src/assets/jmnedict-eng-1.07.json",
  },
  */
  {
    type: "kanjidic" as const,
    src: "../src/assets/kanjidic2-en-3.5.0.json",
    coll: db.collection("kanjidict"),
  },
];

for (const dict of dicts) {
  let i = 0;
  // @ts-expect-error: why oh why
  const loader = loadDictionary(dict.type, dict.src)
    .onMetadata((metadata) => {
      console.log("metadata", metadata);
    })
    .onEntry((entry, metadata) => {
      if (i++ % 1000 === 0) console.log(i);
      // Load an entry into database
      dict.coll.insertOne(entry);
    })
    .onEnd(() => {
      console.log("Finished!");
    });

  /*
  loader.parser.on("error", (error) => {
    console.error(error);
  });
  */
}

import fs from "fs";
import { loadDictionary } from "@scriptin/jmdict-simplified-loader";

const dicts = [
  {
    type: "jmdict" as const,
    src: "../src/assets/jmdict-eng-3.5.0.json",
  },
  /*
  {
    type: "jmnedict" as const,
    src: "../src/assets/jmnedict-eng-1.07.json",
  },
  {
    type: "kanjidic" as const,
    src: "../src/assets/kanjidic2-en-3.5.0.json",
    coll: db.collection("kanjidic"),
  },
  */
];

for (const dict of dicts) {
  let i = 0;
  const out = {
    kana: {} as { [key: string]: string[] },
    kanji: {} as { [key: string]: string[] },
  };
  const loader = loadDictionary(dict.type, dict.src)
    .onMetadata((metadata) => {
      console.log("metadata", metadata);
    })
    .onEntry((entry, metadata) => {
      if (i++ % 1000 === 0) console.log(i);
      for (const type of ["kana", "kanji"] as const) {
        for (const subEntry of entry[type]) {
          subEntry.text;
          const lookup =
            out[type][subEntry.text] || (out[type][subEntry.text] = []);

          // Final table with decimals: 13,372,609
          // Final table with hex:      12,901,336
          // const value = parseInt(entry.id).toString(16);
          const value = entry.id;

          if (lookup.indexOf(value) === -1) {
            lookup.push(value);
          }
        }
      }
    })
    .onEnd(() => {
      console.log("Finished!");
      const dest = dict.src.replace(/\.json$/, ".lookup.json");
      fs.writeFileSync(dest, JSON.stringify(out));
    });

  /*
  loader.parser.on("error", (error) => {
    console.error(error);
  });
  */
}

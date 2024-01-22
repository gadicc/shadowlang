import Kuroshiro from "@sglkc/kuroshiro";
import KuromojiAnalyzer from "@sglkc/kuroshiro-analyzer-kuromoji";

const kuromojiAnalyzer = new KuromojiAnalyzer({ dictPath: "/kuromoji" });

const kuroshiro = new Kuroshiro();
const kuroshiroReady = kuroshiro.init(kuromojiAnalyzer); // a promise

export { kuroshiro, kuroshiroReady, kuromojiAnalyzer };

// Needs to map Kuroshiro's POS to JMDict's POS
// https://www.edrdg.org/jmwsgi/edhelp.py?svc=jmdict&sid=#kw_pos
export const posMap = {
  名詞: "n",
  副詞: "adv",
  記号: "symbol",
  助動詞: "aux-v",
  助詞: "prt",
  動詞: "v",
  形容詞: "adj",
  感動詞: "int",
  接続詞: "conj",
} as { [key: string]: string };

export const posDetail = {
  // '係助詞': conjunction particle
  代名詞: "pn",
} as { [key: string]: string };

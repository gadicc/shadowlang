// @ts-expect-error: no types
import { useFuriPairs, Wrapper, Pair, Text, Furi } from "react-furi";

function Furigana({
  word,
  reading,
  furi,
  showFuri = true,
  wrapperStyle = {},
  furiStyle = {},
  textStyle = {},
}: {
  word: string;
  reading?: string;
  furi?: string;
  showFuri?: boolean;
  wrapperStyle?: React.CSSProperties;
  furiStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
}) {
  const pairs = useFuriPairs(word, reading, furi) as [string, string][];

  return (
    <Wrapper style={wrapperStyle}>
      {pairs.map(([furiText, text], index) => (
        <Pair key={text + index}>
          {showFuri && <Furi style={furiStyle}>{furiText}</Furi>}
          <Text style={textStyle}>{text}</Text>
        </Pair>
      ))}
    </Wrapper>
  );
}

export default Furigana;

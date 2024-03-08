interface GenericSpeechRecognitionList {
  length: number;
  [index: number]: GenericSpeechRecognitionResult;
}

interface GenericSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: GenericSpeechRecognitionAlternative;
}

interface GenericSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface WordMatch {
  word: string;
  reading?: string;
  matched: boolean;
  matchedWord?: string;
  partial?: string;
  alsoAccept?: string[];
  // confidence: number;
}
interface Word {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  word: string;
  alsoAccept?: string[];
}

export default class Matcher {
  words: WordMatch[];

  constructor(wordList: Word[] | string[]) {
    this.words = wordList.map((word) => {
      if (typeof word === "string") return { word, matched: false };
      else {
        const obj: WordMatch = { word: word.word, matched: false };
        if (word.reading) obj.reading = word.reading;
        if (word.alsoAccept) obj.alsoAccept = word.alsoAccept;
        return obj;
      }
    });
  }

  matchTranscript(transcript: string) {
    let updated = false;
    transcript = transcript.replace(/ /g, "");
    // console.log(transcript);

    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];

      if (word.matched) {
        // Skip already matched words and remove from transcript
        if (word.matchedWord)
          transcript = transcript.replace(
            new RegExp("^" + word.matchedWord),
            "",
          );
        else transcript = transcript.replace(new RegExp("^" + word.word), "");
        continue;
      }

      if (transcript.startsWith(word.word)) {
        // Full match: mark as matched and remove from transcript (and clear partials)
        word.matched = true;
        updated = true;
        delete word.partial;
        transcript = transcript.replace(new RegExp("^" + word.word), "");
        continue;
      }
      if (word.reading && transcript.startsWith(word.reading)) {
        // Full match: mark as matched and remove from transcript (and clear partials)
        word.matched = true;
        updated = true;
        delete word.partial;
        transcript = transcript.replace(new RegExp("^" + word.reading), "");
        continue;
      }

      if (word.alsoAccept)
        for (const alt of word.alsoAccept) {
          alt; //?
          transcript; //?
          if (transcript.startsWith(alt)) {
            // Full match: mark as matched and remove from transcript (and clear partials)
            word.matched = true;
            word.matchedWord = alt;
            delete word.partial;
            updated = true;
            console.log("alt: " + alt);
            console.log("1) " + transcript);
            transcript = transcript.replace(new RegExp("^" + alt), "");
            console.log("2) " + transcript);
            continue;
          }
        }

      // Partial match: update partial and remove from transcript
      if (transcript.length && this.words[i].word.startsWith(transcript)) {
        this.words[i].partial = transcript;
        updated = true;
        continue;
      }
      if (transcript.length && this.words[i].reading?.startsWith(transcript)) {
        this.words[i].partial = transcript;
        updated = true;
        continue;
      }
    }

    if (updated) this.words = this.words.slice();
  }

  match(results: GenericSpeechRecognitionList) {
    for (let ri = 0; ri < results.length; ri++) {
      const result = results[ri];
      // const isFinal = result.isFinal;

      for (let ai = 0; ai < result.length; ai++) {
        const alternative = result[ai];
        const { transcript, confidence } = alternative;
        // On Chrome/Android we get dupe results with confidence 0, so skip.
        if (confidence > 0) this.matchTranscript(transcript);
      }
    }
    return this.words;
  }
}

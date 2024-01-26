import type { WordEntry } from "@/app/api/jpSentence/processor";

export interface Transcription {
  language: string;
  num_speakers: string;
  segments: {
    end: string;
    speaker: string;
    start: string;
    text: string;
    words: {
      end: number;
      start: number;
      word: string;
    }[];
  }[];
}

export interface Lesson {
  title: {
    [key: string]: string;
  };
  speakers: {
    id: number;
    name: string;
  }[];
  blocks: {
    speakerId: number;
    text: string;
    words: WordEntry[];
    translations: BlockTranslations;
    audio: {
      src: string;
      start: number;
      end: number;
    };
    status?: {
      title: string;
      showProgress: boolean;
      message?: string;
    };
  }[];
}

export interface BlockTranslations {
  [key: string]: {
    text: string;
    punctuation?: string;
    wordIdx?: number;
    word?: string;
  }[];
}

export { WordEntry };

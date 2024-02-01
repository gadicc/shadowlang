import type { WordEntry } from "@/app/api/jpSentence/processor";

export interface BlockWord extends WordEntry {
  start?: number;
  end?: number;
}

export interface Transcription {
  language: string;
  num_speakers: number;
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

export interface Speaker {
  id: number;
  speakerId?: string;
  name?: string;
  url?: string;
  initials?: string;
}

export interface Lesson {
  title: {
    [key: string]: string;
  };
  audio: {
    filename: string;
    sha256: string;
    size: number;
    duration?: number;
  };
  speakers: Speaker[];
  blocks: {
    speakerId: number;
    text: string;
    words: BlockWord[];
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

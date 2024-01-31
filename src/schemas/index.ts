export type {
  JMdictWord,
  JMdict,
  Kanjidic2,
  Kanjidic2Character,
} from "@scriptin/jmdict-simplified-types";

import type { Lesson as _Lesson } from "@/app/lesson/edit/types";

export interface Lesson extends _Lesson {
  [key: string]: unknown;
  _id: string;
  userId: string;
  createdAt: Date;
  __updatedAt: number;
}

export * from "./user";
export * from "./speaker";

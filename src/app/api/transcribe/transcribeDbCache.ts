import transcribe from "./transcribe";
import { db } from "@/api-lib/db";

const Transcriptions = db.collection("transcriptions");
// db.transcriptions.createIndex({ "audioSHA256": 1 }, { name: 'audioSHA256' });

export default async function transcribeDbCache({
  sha256,
  language,
}: {
  sha256: string;
  language: string;
}) {
  const cached = await Transcriptions.findOne({ audioSHA256: sha256 });
  if (cached) {
    return cached;
  }

  const transcription = await transcribe({ sha256, language });
  const doc = {
    audioSHA256: sha256,
    transcription,
    createdAt: new Date(),
  };

  const result = await Transcriptions.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

"use client";
import React from "react";
import { useSearchParams } from "next/navigation";

import {
  Container,
  Tabs,
  Tab,
  Typography,
  Box,
  LinearProgress,
  Button,
} from "@mui/material";

import { jmdict } from "@/dicts";
import type { Lesson, Transcription } from "./types";
import TextBlock, { useMergeSpeakers } from "../[_id]/TextBlock";
import EditBlock, { analyzeBlockSentence } from "./EditBlock";
import Translations from "./Translations";
import matchTimestamps from "./matchTimestamps";
import { useGongoSub, useGongoOne, db, useGongoLive } from "gongo-client-react";
import Upload, { FileEntry } from "@/lib/upload";

jmdict;

function stripUnderscoredKeys(key: string, value: unknown) {
  if (key.startsWith("_")) return undefined;
  return value;
}

function stripMatchesAndMorphemes(lesson: Partial<Lesson>) {
  const newLesson = { ...lesson };
  newLesson.blocks = newLesson.blocks?.map((block) => {
    const newBlock = {
      ...block,
      words: block.words?.map((word) => {
        const newWord = { ...word };
        // @ts-expect-error: TODO, different types
        delete newWord.matches;
        delete newWord.morpheme;
        return newWord;
      }),
    };
    return newBlock;
  });
  return newLesson;
}

function EditableLangTable({
  value,
  setValue,
  langs = ["en"],
}: {
  value: { [key: string]: string };
  setValue: (value: { [key: string]: string }) => void;
  langs?: string[];
}) {
  if (!langs) langs = Object.keys(value);
  return (
    <table border={1} cellSpacing={0} width="100%">
      <thead>
        <tr>
          <th>Lang</th>
          <th>Text</th>
        </tr>
      </thead>
      <tbody>
        {langs.map((lang) => (
          <tr key={lang}>
            <td>{lang}</td>
            <td>
              <input
                type="text"
                style={{ width: "100%" }}
                value={value[lang] || ""}
                onChange={(e) => {
                  const newValue = { ...value };
                  newValue[lang] = e.target.value;
                  setValue(newValue);
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CustomTabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Speakers({
  speakers,
  lesson,
  setLesson,
}: {
  speakers?: Lesson["speakers"];
  lesson: Partial<Lesson>;
  setLesson(lesson: Partial<Lesson>): void;
}) {
  useGongoSub("speakers");
  const dbSpeakers = useGongoLive((db) => db.collection("speakers").find({}));

  return (
    <div style={{ marginBottom: 20 }}>
      <ol>
        {speakers?.map((speaker, i) => (
          <li key={i}>
            <select
              value={speaker.speakerId || ""}
              onChange={(e) => {
                const newSpeakers = [...speakers];
                newSpeakers[i].speakerId = e.target.value;
                setLesson({ ...lesson, speakers: newSpeakers });
              }}
            >
              <option value="">Custom</option>
              {dbSpeakers?.map((dbSpeaker) => (
                <option key={dbSpeaker._id} value={dbSpeaker._id}>
                  {dbSpeaker.name}
                </option>
              ))}
            </select>
            {!speaker.speakerId && (
              <span>
                {" "}
                <input
                  type="text"
                  value={speaker.name || ""}
                  onChange={(e) => {
                    const newSpeakers = [...speakers];
                    newSpeakers[i].name = e.target.value;
                    setLesson({ ...lesson, speakers: newSpeakers });
                  }}
                />{" "}
                <input
                  type="text"
                  value={speaker.initials || ""}
                  onChange={(e) => {
                    const newSpeakers = [...speakers];
                    newSpeakers[i].initials = e.target.value;
                    setLesson({ ...lesson, speakers: newSpeakers });
                  }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

const LessonBlock = React.memo(function LessonBlock({
  block,
  i,
  editIdx,
  setEditIdx,
  editTabIdx,
  setEditTabIdx,
  mergeBlockIdx,
  speakers,
  lessonAudio,
}: {
  block: Lesson["blocks"][0];
  i: number;
  editIdx: number;
  setEditIdx(i: number): void;
  editTabIdx: number;
  setEditTabIdx(i: number): void;
  mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>): void;
  speakers: Lesson["speakers"];
  lessonAudio?: Lesson["audio"];
}) {
  return (
    <div
      key={i}
      style={{
        border: editIdx === i ? "1px dotted black" : "1px solid transparent",
        padding: 5,
      }}
      onClick={() => setEditIdx(i)}
    >
      <TextBlock
        key={i}
        text={block.text}
        speakerId={block.speakerId}
        speakers={speakers}
        audio={block.audio}
        words={block.words}
        translations={block.translations}
        isCurrent={false} // XXX event logic TODO
        status={block.status}
        lessonAudio={lessonAudio}
      />
      {editIdx === i ? (
        <>
          <Tabs
            value={editTabIdx}
            onChange={(e, value) => setEditTabIdx(value)}
          >
            <Tab label="Text" />
            <Tab label="Translations" />
          </Tabs>
          <CustomTabPanel value={editTabIdx} index={0}>
            <EditBlock block={block} i={i} mergeBlockIdx={mergeBlockIdx} />
          </CustomTabPanel>
          <CustomTabPanel value={editTabIdx} index={1}>
            <Translations
              text={block.text}
              words={block.words}
              translations={block.translations}
              // setTranslations={setTranslations}
              i={i}
              mergeBlockIdx={mergeBlockIdx}
            />
          </CustomTabPanel>
        </>
      ) : null}
    </div>
  );
});

function Edit() {
  const searchParams = useSearchParams();
  const lessonId = searchParams?.get("id");

  useGongoSub("lesson", { _id: lessonId });
  useGongoSub("speakers");
  const dbLesson = useGongoOne((db) =>
    db.collection("lessons").find({ _id: lessonId }),
  );
  const dbSpeakers = useGongoLive((db) => db.collection("speakers").find({}));

  const [lesson, _setLesson] = React.useState<Partial<Lesson> | null>(null);
  useGongoSub("transcriptions", { audioSHA256: lesson?.audio?.sha256 });
  const latestLesson = React.useRef<Partial<Lesson>>();
  const transRef = React.useRef<Transcription>();
  const transDb = useGongoOne((db) =>
    db
      .collection("transcriptions")
      .find({ audioSHA256: lesson?.audio?.sha256 }),
  ) as { transcription: Transcription } | null;
  const [editIdx, setEditIdx] = React.useState(-1);
  const [editTabIdx, setEditTabIdx] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [fileEntry, setFileEntry] = React.useState<FileEntry | null>(null);

  const setLesson = React.useCallback(
    function setLesson(lesson: Partial<Lesson>) {
      latestLesson.current = lesson;
      _setLesson(lesson);
    },
    [_setLesson],
  );

  React.useEffect(() => {
    if (lesson) return;
    if (dbLesson) setLesson(dbLesson);
  }, [dbLesson, lesson, setLesson]);

  // TODO, what if a new update comes in while we're editing?
  // on the other hand, we rely on this for self updates.
  const orig = React.useMemo(
    () => JSON.stringify(dbLesson, stripUnderscoredKeys),
    [dbLesson],
  );
  const hasChanged = React.useMemo(
    () =>
      orig !==
      JSON.stringify(
        stripMatchesAndMorphemes(lesson || {}),
        stripUnderscoredKeys,
      ),
    [lesson, orig],
  );

  const speakers = useMergeSpeakers(lesson?.speakers, dbSpeakers);

  if (!lesson) return "Loading...";

  function mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>) {
    const lesson = latestLesson.current;
    if (!lesson)
      throw new Error("mergeBlockIdx called before latestLesson.current set");

    if (!lesson.blocks) lesson.blocks = [];

    const newBlock = { ...lesson.blocks[i], ...blockMerge };
    if (false)
      console.log("mergeBlockIdx", {
        i,
        orig: lesson!.blocks![i],
        newBlock,
      });

    const newBlocks = [...lesson.blocks];
    newBlocks[i] = newBlock;
    setLesson({ ...lesson, blocks: newBlocks });
  }

  async function processAudio() {
    const sha256 = fileEntry?.sha256 || lesson?.audio?.sha256;
    if (!sha256) {
      alert("No sha256 to process");
      return;
    }

    setIsProcessing(true);
    const request = await fetch("/api/transcribe", {
      method: "POST",
      body: JSON.stringify({ sha256, language: "ja" }),
    });
    const dbResult = await request.json();
    const result = dbResult.transcription as Transcription;

    // Because we can't rely on the segmentation from the transcription,
    // we'll need this again later after the analysis to assign the
    // timestamps.
    transRef.current = result;

    const speakers: { [key: string]: { id: number; name: string } } = {};
    let speakerCount = 0;
    for (const seg of result.segments) {
      if (!speakers[seg.speaker])
        speakers[seg.speaker] = { id: speakerCount++, name: seg.speaker };
    }

    // console.log(result);
    // console.log({ speakers });

    const newLesson = { ...lesson };
    newLesson.speakers = Object.values(speakers);
    newLesson.blocks = result.segments.map((seg) => ({
      speakerId: speakers[seg.speaker].id,
      text: seg.text,
      words: [],
      translations: { en: [] },
      audio: {
        start: parseFloat(seg.start),
        end: parseFloat(seg.end),
      },
    }));
    setLesson(newLesson);
    setIsProcessing(false);

    newLesson.blocks.forEach((block, i) =>
      analyzeBlockSentence(block, i, mergeBlockIdx).then(() => {
        const trans = transDb?.transcription || transRef.current;
        if (trans && latestLesson.current) {
          // @ts-expect-error: another day
          matchTimestamps(trans, latestLesson.current);
          setLesson({ ...latestLesson.current });
        }
      }),
    );
  }

  // console.log("lesson", lesson);

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6">Title</Typography>
      <EditableLangTable
        value={lesson?.title || {}}
        setValue={(title) => {
          if (!lesson) return;
          setLesson({ ...lesson, title });
        }}
      />
      <br />

      <Typography variant="h6">Audio</Typography>
      <Upload
        onResult={(entry: FileEntry) => {
          setFileEntry(entry);
          if (entry.type === "audio") {
            setLesson({
              ...lesson,
              audio: {
                filename: entry.filename || "unknown",
                size: entry.size,
                sha256: entry.sha256,
                duration: entry.audio.duration,
              },
            });
          }
        }}
      />
      {!fileEntry && lesson.audio && (
        <div>
          <br />
          <b>Previously uploaded:</b> {lesson.audio.filename},{" "}
          {lesson.audio.size} bytes, {lesson.audio.duration?.toFixed(2)} seconds
        </div>
      )}

      <br />
      <button
        style={{ width: 100 }}
        disabled={isProcessing || (!fileEntry && !lesson.audio)}
        onClick={processAudio}
      >
        {isProcessing ? (
          <LinearProgress
            sx={{
              display: "inline-block",
              width: "100%",
              verticalAlign: "middle",
            }}
          />
        ) : (
          "Process"
        )}
      </button>
      <br />
      <br />

      <Typography variant="h6">Speakers</Typography>
      <Speakers
        speakers={lesson.speakers}
        lesson={lesson}
        setLesson={setLesson}
      />

      <Typography variant="h6">Blocks</Typography>
      <div style={{ fontSize: "80%" }}>
        <ol>
          <li>Click on a block to edit it.</li>
          <li>Click on an avatar icon to test playback.</li>
        </ol>
      </div>

      {lesson.blocks?.map((block, i) => (
        <LessonBlock
          key={i}
          block={block}
          i={i}
          editIdx={editIdx}
          setEditIdx={setEditIdx}
          editTabIdx={editTabIdx}
          setEditTabIdx={setEditTabIdx}
          mergeBlockIdx={mergeBlockIdx}
          speakers={speakers}
          lessonAudio={lesson.audio}
        />
      ))}
      {hasChanged ? (
        <div
          style={{
            position: "fixed",
            bottom: 10,
            right: 10,
          }}
        >
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              const $set = stripMatchesAndMorphemes(lesson);
              // @ts-expect-error: trust me :)
              delete $set._id;
              db.collection("lessons").update({ _id: lessonId }, { $set });
            }}
          >
            Save Changes
          </Button>
        </div>
      ) : null}
    </Container>
  );
}

export default function WrappedEdit() {
  return (
    <React.Suspense>
      <Edit />
    </React.Suspense>
  );
}

"use client";
import React from "react";

import { Container, Tabs, Tab, Typography, Box } from "@mui/material";

import { jmdict } from "@/dicts";
import type { Lesson, Transcription } from "./types";
import TextBlock from "../[_id]/TextBlock";
import EditBlock, { analyzeBlockSentence } from "./EditBlock";
import Translations from "./Translations";
import matchTimestamps from "./matchTimestamps";

jmdict;

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
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
}: {
  block: Lesson["blocks"][0];
  i: number;
  editIdx: number;
  setEditIdx(i: number): void;
  editTabIdx: number;
  setEditTabIdx(i: number): void;
  mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>): void;
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
        avatar={String.fromCharCode(65 + block.speakerId)} // TODO
        audio={block.audio}
        words={block.words}
        translations={block.translations}
        isCurrent={false} // XXX event logic TODO
        status={block.status}
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

export default function Edit() {
  const [lesson, _setLesson] = React.useState<Partial<Lesson>>({});
  const latestLesson = React.useRef<Partial<Lesson>>();
  const transRef = React.useRef<Transcription>();
  const [editIdx, setEditIdx] = React.useState(-1);
  const [editTabIdx, setEditTabIdx] = React.useState(0);

  const setLesson = React.useCallback(
    function setLesson(lesson: Partial<Lesson>) {
      latestLesson.current = lesson;
      _setLesson(lesson);
    },
    [_setLesson],
  );

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
    const request = await fetch("/api/transcribe", {
      method: "POST",
      body: JSON.stringify({ src: "/audio/lesson1.mp3" }),
    });
    const result = (await request.json()) as Transcription;

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

    console.log(result);
    console.log({ speakers });

    const newLesson = { ...lesson };
    newLesson.speakers = Object.values(speakers);
    newLesson.blocks = result.segments.map((seg) => ({
      speakerId: speakers[seg.speaker].id,
      text: seg.text,
      words: [],
      translations: { en: [] },
      audio: {
        src: "1absolutebeginner_lesson1.m4a",
        start: parseFloat(seg.start),
        end: parseFloat(seg.end),
      },
    }));
    setLesson(newLesson);

    newLesson.blocks.forEach((block, i) =>
      analyzeBlockSentence(block, i, mergeBlockIdx).then(() => {
        if (transRef.current && latestLesson.current) {
          // @ts-expect-error: another day
          matchTimestamps(transRef.current, latestLesson.current);
          setLesson({ ...latestLesson.current });
        }
      }),
    );
  }

  console.log("lesson", lesson);

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
      <div>TODO</div>
      <button onClick={processAudio}>Process</button>
      <br />

      <Typography variant="h6">Speakers</Typography>
      <br />

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
        />
      ))}
    </Container>
  );
}

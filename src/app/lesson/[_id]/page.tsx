"use client";
import React from "react";
import { Container, Typography } from "@mui/material";

import { jmdict } from "../../../dicts";
jmdict;
import TextBlock, { useMergeSpeakers } from "./TextBlock";
import { useGongoLive, useGongoOne, useGongoSub } from "gongo-client-react";

export default function LessonId({
  params: { _id },
}: {
  params: { _id: string };
}) {
  useGongoSub("lesson", { _id });
  useGongoSub("speakers");
  const lesson = useGongoOne((db) => db.collection("lessons").find({ _id }));
  const dbSpeakers = useGongoLive((db) => db.collection("speakers").find());
  const speakers = useMergeSpeakers(lesson?.speakers, dbSpeakers);

  const idx = -1;
  // const setIdx = () => {};

  if (!lesson) return "Loading...";

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h5" sx={{ textDecoration: "underline", mb: 2 }}>
        {lesson.title.en}
      </Typography>
      {lesson.blocks.map((block, i) => (
        <TextBlock
          key={i}
          speakers={speakers}
          speakerId={block.speakerId}
          text={block.text}
          words={block.words}
          translations={block.translations}
          isCurrent={i === idx}
          // idx={idx}
          // setIdx={setIdx}
          audio={block.audio}
          lessonAudio={lesson.audio}
        />
      ))}
    </Container>
  );
}

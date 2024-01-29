"use client";
import React from "react";
import lesson from "@/assets/op-jp-ab-1.json";
import { Container, Typography } from "@mui/material";

import { jmdict } from "../../../dicts";
jmdict;
import TextBlock from "./TextBlock";
import { Lesson } from "../edit/types";

export default function LessonId({
  params: { _id },
}: {
  params: { _id: string };
}) {
  const idx = 0;
  // const setIdx = () => {};

  const speakers = lesson.speakers;
  function avatar(block: Lesson["blocks"][0]) {
    const speakerId = block.speakerId;
    const speaker = speakers[speakerId];
    return speaker.avatar;
  }

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h5" sx={{ textDecoration: "underline", mb: 2 }}>
        {lesson.title.en}
      </Typography>
      {lesson.blocks.map((block, i) => (
        <TextBlock
          key={i}
          avatar={avatar(block)}
          text={block.text}
          words={block.words}
          translations={block.translations}
          isCurrent={i === idx}
          // idx={idx}
          // setIdx={setIdx}
          audio={block.audio}
        />
      ))}
    </Container>
  );
}

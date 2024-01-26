"use client";
import React from "react";
import lesson from "@/assets/op-jp-ab-1.json";
import { Container, Typography } from "@mui/material";

import { jmdict } from "../../../dicts";
jmdict;
import TextBlock from "./TextBlock";

export default function LessonId({
  params: { _id },
}: {
  params: { _id: string };
}) {
  const idx = 0;
  // const setIdx = () => {};

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h5" sx={{ textDecoration: "underline", mb: 2 }}>
        {lesson.title}
      </Typography>
      {lesson.texts.map((entry, i) => (
        <TextBlock
          key={i}
          avatar={entry.avatar}
          text={entry.text}
          words={entry.words}
          translations={entry.translations}
          isCurrent={i === idx}
          // idx={idx}
          // setIdx={setIdx}
          audio={entry.audio}
        />
      ))}
    </Container>
  );
}

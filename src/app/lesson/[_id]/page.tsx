"use client";
import React from "react";
import { Button, Container, Typography } from "@mui/material";

import { jmdict } from "../../../dicts";
jmdict;
import TextBlock, { useMergeSpeakers } from "./TextBlock";
import { useGongoLive, useGongoOne, useGongoSub } from "gongo-client-react";

function useLessonController(events = ["play"]) {
  const [currentBlockIdx, setCurrentBlockIdx] = React.useState(-1);
  const [currentEvent, setCurrentEvent] = React.useState("");
  const delay = 1000;

  const eventDone = React.useCallback(
    function eventDone(event: string) {
      if (event !== currentEvent) {
        console.warn(
          `Ignoring eventDone("${event}") when currentEvent is "${currentEvent}"`,
        );
        return;
      }

      // console.log("eventDone", event);
      const evIdx = events.indexOf(event);
      if (evIdx < events.length - 1) {
        setCurrentEvent(events[evIdx + 1]);
      } else {
        setCurrentBlockIdx(-2);
        setTimeout(() => {
          setCurrentBlockIdx(currentBlockIdx + 1);
          setCurrentEvent(events[0]);
        }, delay);
      }
    },
    [currentBlockIdx, currentEvent, events],
  );

  return {
    currentBlockIdx,
    setCurrentBlockIdx,
    currentEvent,
    setCurrentEvent,
    eventDone,
  };
}

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
  const {
    currentBlockIdx,
    currentEvent,
    setCurrentBlockIdx,
    setCurrentEvent,
    eventDone,
  } = useLessonController();

  // console.log("currentBlockIdx", currentBlockIdx, "currentEvent", currentEvent);

  if (!lesson) return "Loading...";

  return (
    <Container
      sx={{
        py: 2,
        backgroundColor: "#efeae2",
        backgroundImage: "url(/img/bg-tile.png)",
        backgroundAttachment: "fixed",
      }}
    >
      <Typography variant="h5" sx={{ textDecoration: "underline", mb: 2 }}>
        {lesson.title.en}
      </Typography>
      <Button
        variant="outlined"
        sx={{ mb: 2, background: "#fafafa" }}
        onClick={() => {
          if (
            currentBlockIdx === -1 ||
            currentBlockIdx === lesson.blocks.length
          )
            setCurrentBlockIdx(0);
          setCurrentEvent("play");
        }}
      >
        Start
      </Button>
      {lesson.blocks.map((block, i) => (
        <TextBlock
          key={i}
          speakers={speakers}
          speakerId={block.speakerId}
          text={block.text}
          words={block.words}
          translations={block.translations}
          audio={block.audio}
          lessonAudio={lesson.audio}
          event={currentBlockIdx === i ? currentEvent : undefined}
          eventDone={currentBlockIdx === i ? eventDone : undefined}
          style={{ marginBottom: "20px" }}
        />
      ))}
    </Container>
  );
}

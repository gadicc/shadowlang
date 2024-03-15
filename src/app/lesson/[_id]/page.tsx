"use client";
import React from "react";
import Furigana from "@/lib/furigana";
import { useGongoLive, useGongoOne, useGongoSub } from "gongo-client-react";

import {
  // Checkbox,
  Container,
  // FormControlLabel,
  // FormGroup,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  Hearing,
  HearingDisabled,
  PlayCircle,
  StopCircle,
} from "@mui/icons-material";

import { jmdict } from "../../../dicts";
jmdict;
import TextBlock, { useMergeSpeakers } from "./TextBlock";
import Markdown from "marked-react";

function useLessonController(length = 0, events = ["play", "delay"]) {
  const [currentBlockIdx, setCurrentBlockIdx] = React.useState(-1);
  const [currentEvent, setCurrentEvent] = React.useState("");
  const [previousEvent, setPreviousEvent] = React.useState("");
  const [paused, setPaused] = React.useState(true);
  const delay = 1000;

  const eventDoneRef = React.useRef<(event: string) => void>();
  const eventDone = (eventDoneRef.current = React.useCallback(
    function eventDone(event: string) {
      if (paused) return;
      if (event !== currentEvent) {
        console.warn(
          `Ignoring eventDone("${event}") when currentEvent is "${currentEvent}"`,
        );
        return;
      }

      // console.log("eventDone", event);
      const evIdx = events.indexOf(event);
      if (evIdx < events.length - 1) {
        setPreviousEvent(currentEvent);
        setCurrentEvent(events[evIdx + 1]);
        if (events[evIdx + 1] === "delay")
          setTimeout(() => eventDoneRef.current?.("delay"), delay);
      } else {
        // setCurrentBlockIdx(-2);
        if (currentBlockIdx < length - 1) {
          setCurrentBlockIdx(currentBlockIdx + 1);
          setCurrentEvent(events[0]);
          setPreviousEvent("");
        }
      }
    },
    [currentBlockIdx, currentEvent, events, paused, length, eventDoneRef],
  ));

  return {
    currentBlockIdx,
    setCurrentBlockIdx,
    previousEvent,
    currentEvent,
    setCurrentEvent,
    eventDone,
    paused,
    setPaused,
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

  const [showFuri, setShowFuri] = React.useState(true);
  const [showRomaji, setShowRomaji] = React.useState(true);
  const [showTranslation, setShowTranslation] = React.useState(true);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [shouldListen, setShouldListen] = React.useState(true);

  const {
    currentBlockIdx,
    currentEvent,
    previousEvent,
    setCurrentBlockIdx,
    setCurrentEvent,
    eventDone,
    paused,
    setPaused,
  } = useLessonController(
    lesson?.blocks.length,
    shouldListen ? ["play", "listen", "delay"] : ["play", "delay"],
  );

  // console.log("currentBlockIdx", currentBlockIdx, "currentEvent", currentEvent);

  if (!lesson) return "Loading...";

  return (
    <>
      <Container
        sx={{
          pt: 2,
          backgroundColor: "#efeae2",
          backgroundImage: "url(/img/bg-tile.png)",
          backgroundAttachment: "fixed",
          pb: 8, // for position:fixed play bar on bottom
        }}
      >
        <Typography variant="h5" sx={{ textDecoration: "underline", mb: 2 }}>
          {lesson.title.en}
        </Typography>
        <Markdown>{lesson.intros.en}</Markdown>
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
            prevEvent={previousEvent}
            event={!paused && currentBlockIdx === i ? currentEvent : undefined}
            eventDone={!paused && currentBlockIdx === i ? eventDone : undefined}
            style={{ marginBottom: "20px" }}
            showFuri={showFuri}
            showRomaji={showRomaji}
            showTranslation={showTranslation}
            playbackRate={playbackRate}
          />
        ))}
      </Container>
      <Container
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          pt: 1.2, // for gradient blur
          pb: 1,
          px: 2,
          background:
            "linear-gradient(180deg, rgba(240,240,240,0) 0%, rgba(240,240,240,1) 7%)",
        }}
      >
        <Stack
          spacing={2}
          direction="row"
          justifyContent="left"
          alignItems="center"
        >
          <IconButton
            onClick={() => {
              if (paused) {
                if (
                  currentBlockIdx === -1 ||
                  currentBlockIdx === lesson.blocks.length - 1
                ) {
                  setCurrentBlockIdx(0);
                  setCurrentEvent("play");
                }
              }
              setPaused(!paused);
            }}
          >
            {paused ? (
              <PlayCircle fontSize="large" />
            ) : (
              <StopCircle fontSize="large" />
            )}
          </IconButton>
          <LinearProgress
            sx={{ width: 100 }}
            variant="determinate"
            value={((currentBlockIdx + 1) / lesson.blocks.length) * 100}
          />
          <span>
            {currentBlockIdx + 1}/{lesson.blocks.length}
          </span>
          <span
            style={{ opacity: showFuri ? 1 : 0.2, cursor: "pointer" }}
            onClick={() => setShowFuri(!showFuri)}
          >
            <Furigana
              word="葉"
              reading="⏺⏺"
              wrapperStyle={{ verticalAlign: "middle" }}
              textStyle={{ fontSize: 16 }}
              furiStyle={{ fontSize: 2 }}
            />
          </span>

          <span
            style={{
              opacity: showRomaji ? 1 : 0.2,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onClick={() => setShowRomaji(!showRomaji)}
          >
            あa
          </span>

          <span
            style={{ opacity: showTranslation ? 1 : 0.2, cursor: "pointer" }}
            onClick={() => setShowTranslation(!showTranslation)}
          >
            Trans
          </span>

          <span
            style={{
              opacity: shouldListen ? 1 : 0.2,
              cursor: "pointer",
            }}
            onClick={() => setShouldListen(!shouldListen)}
          >
            {shouldListen ? (
              <Hearing sx={{ verticalAlign: "middle" }} />
            ) : (
              <HearingDisabled sx={{ verticalAlign: "middle" }} />
            )}
          </span>

          <span
            style={{
              border: "1px solid #aaa",
              borderRadius: "5px",
              padding: "2px 5px 2px 5px",
              fontSize: "12px",
              background: "rgba(0,0,0,0.1)",
            }}
            onClick={() => setPlaybackRate(playbackRate === 1 ? 0.5 : 1)}
          >
            {playbackRate}x
          </span>

          {/* 
          <FormGroup>
            <FormControlLabel
              sx={{ ml: 0, mr: 0 }}
              control={
                <Checkbox
                  checked={showTranslation}
                  onChange={() => setShowTranslation(!showTranslation)}
                />
              }
              label="Trans"
            />
          </FormGroup>
          */}
        </Stack>
      </Container>
    </>
  );
}

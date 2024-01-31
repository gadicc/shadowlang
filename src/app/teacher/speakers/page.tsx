"use client";
import React from "react";
import {
  db,
  useGongoLive,
  useGongoSub,
  useGongoUserId,
} from "gongo-client-react";
import * as _ from "radash";

import { Button, Container } from "@mui/material";

import { Speaker } from "@/schemas";
import { Collection } from "gongo-client";
import Image from "next/image";

const update = _.debounce(
  { delay: 1000 },
  (...params: Parameters<Collection<Speaker>["update"]>) =>
    db.collection("speakers").update(...params),
);

function SpeakerItem({
  speaker,
  userId,
}: {
  speaker: Speaker;
  userId: string;
}) {
  const [mySpeaker, setMySpeaker] = React.useState(speaker);
  /*
  const hasChanged =
    mySpeaker.name !== speaker.name || mySpeaker.url !== speaker.url;
  */

  const setSpeaker = (newSpeaker: Speaker) => {
    setMySpeaker(newSpeaker);
    update(speaker._id, { $set: newSpeaker });
  };

  React.useEffect(() => {
    setMySpeaker(speaker);
  }, [speaker]);

  return (
    <div
      style={{
        width: 200,
        margin: 10,
        border: "1px solid #555",
        borderRadius: "5px",
        padding: "5px 10px 5px 10px",
        marginBottom: "25px",
        textAlign: "center",
      }}
    >
      <Image
        src={mySpeaker.url}
        alt={mySpeaker.name || "Speaker Avatar"}
        height={100}
        width={100}
      />
      <br />
      <input
        type="text"
        disabled={speaker.userId !== userId}
        value={mySpeaker.name}
        placeholder="Name"
        onChange={(e) => setSpeaker({ ...mySpeaker, name: e.target.value })}
      />
      <br />
      <input
        type="text"
        disabled={speaker.userId !== userId}
        placeholder="URL"
        value={mySpeaker.url}
        onChange={(e) => setSpeaker({ ...mySpeaker, url: e.target.value })}
      />
    </div>
  );
}

export default function TeachersSpeakers() {
  const userId = useGongoUserId() as string | null;

  useGongoSub("speakers");
  const speakers = useGongoLive((db) => db.collection("speakers").find({}));

  if (!userId) return "Log in first";

  return (
    <Container sx={{ my: 2 }}>
      <div style={{ display: "flex" }}>
        {speakers.map((speaker) => (
          <SpeakerItem key={speaker._id} speaker={speaker} userId={userId} />
        ))}
      </div>
      <Button
        onClick={() =>
          // @ts-expect-error: really?  make insert take an OptionalId<>
          db.collection("speakers").insert({ name: "", url: "", userId })
        }
        variant="outlined"
      >
        Add Speaker
      </Button>
    </Container>
  );
}

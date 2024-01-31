"use client";
import React from "react";
import { useGongoUserId, useGongoLive, useGongoSub } from "gongo-client-react";

import { Container } from "@mui/material";

import type { Lesson } from "@/schemas";
import Link from "@/lib/link";

function Lesson({ lesson }: { lesson: Lesson }) {
  return (
    <li>
      <Link href={"/lesson/" + lesson._id}>{lesson.title.en}</Link>
    </li>
  );
}

export default function Lessons() {
  const _userId = useGongoUserId();
  const lessons = useGongoLive((db) => db.collection("lessons").find());
  useGongoSub("lessons");
  console.log("lessons", lessons);

  return (
    <Container sx={{ my: 2 }}>
      <ol>
        {lessons.map((lesson) => (
          <Lesson key={lesson._id} lesson={lesson} />
        ))}
      </ol>
    </Container>
  );
}

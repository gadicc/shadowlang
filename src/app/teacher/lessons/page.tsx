"use client";
import React from "react";
import { useGongoLive, useGongoSub, useGongoUserId } from "gongo-client-react";
import { formatDate } from "date-fns";

import {
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { Lesson } from "@/schemas";
import Link from "@/lib/link";

function TeacherLessonRow({ lesson }: { lesson: Lesson }) {
  return (
    <TableRow>
      <TableCell width={150}>
        {formatDate(lesson.createdAt, "yyyy-MM-dd")}
      </TableCell>
      <TableCell>
        <Link href={"/lesson/edit?id=" + lesson._id}>{lesson?.title?.en}</Link>
      </TableCell>
    </TableRow>
  );
}

export default function TeacherLessons() {
  const userId = useGongoUserId();
  const sub = useGongoSub("lessons", { userId });
  const lessons = useGongoLive((db) =>
    db.collection("lessons").find({ userId }),
  );

  return (
    <Container sx={{ my: 2 }}>
      <TableContainer component={Paper}>
        <Table sx={{ width: "100%" }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Title</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lessons.map((lesson) => (
              <TeacherLessonRow key={lesson._id} lesson={lesson} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <br />
      <Button
        onClick={() =>
          // @ts-expect-error: really?  make insert take an OptionalId<>
          db.collection("lessons").insert({
            userId,
            title: { en: "New Lesson" },
            createdAt: new Date(),
          })
        }
        variant="outlined"
      >
        Add Lesson
      </Button>
    </Container>
  );
}
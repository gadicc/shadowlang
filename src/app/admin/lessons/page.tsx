"use client";
import Link from "@/lib/link";
import { Container } from "@mui/material";
import { db, useGongoLive, useGongoSub } from "gongo-client-react";
import React from "react";

function displayName(userId: string) {
  const user = db.collection("users").findOne({ _id: userId });
  return user?.displayName || "Unknown";
}

export default function AdminLessons() {
  useGongoSub("lessons", { userId: "all" });
  const lessons = useGongoLive((db) => db.collection("lessons").find({}));

  return (
    <Container sx={{ my: 2 }}>
      <h1>Welcome to Admin Lessons!</h1>
      <table border={1} cellPadding={5} cellSpacing={1}>
        <thead>
          <tr>
            <th>User</th>
            <th>Lesson</th>
            <th>Public</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson._id}>
              <td>{displayName(lesson.userId)}</td>
              <td>
                <Link href={"/lesson/edit?id=" + lesson._id}>
                  {lesson.title.en}
                </Link>
              </td>
              <td>{lesson.public ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}

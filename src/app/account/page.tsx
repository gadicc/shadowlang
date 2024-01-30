"use client";
import React from "react";
import { Button, Container, Typography } from "@mui/material";
import { db, useGongoOne, useGongoUserId } from "gongo-client-react";

export default function Account() {
  const userId = useGongoUserId();
  const user = useGongoOne((db) =>
    db.collection("users").find({ _id: userId }),
  );
  const isTeacher = !!user?.teacher;

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h5">Teacher Mode</Typography>
      <p>
        Click the button below to enable &quot;teacher mode&quot;. This will
        allow you to create lessons, etc.
      </p>
      <Button
        onClick={() => {
          db.collection("users").update(
            { _id: userId },
            { $set: { teacher: !isTeacher } },
          );
        }}
        variant="outlined"
      >
        {isTeacher ? "Disable" : "Enable"} Teacher Mode
      </Button>
    </Container>
  );
}

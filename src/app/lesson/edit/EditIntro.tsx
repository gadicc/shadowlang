import React from "react";
import Markdown from "marked-react";
import { Stack, TextField, Typography } from "@mui/material";

export default function EditIntro({
  intros,
  setIntros,
}: {
  intros: Record<string, string>;
  setIntros: (intros: Record<string, string>) => void;
}) {
  const lang = "en";
  const intro = intros[lang];

  return (
    <>
      <Typography variant="h6">Intro ({lang})</Typography>
      <Stack
        spacing={2}
        direction={{ xs: "column", sm: "row" }}
        alignItems="stretch"
      >
        <div style={{ width: "100%" }}>
          <TextField
            multiline
            minRows={2}
            fullWidth
            margin="none"
            InputProps={{ style: { height: "100%" } }}
            value={intro}
            onChange={(e) => setIntros({ ...intros, [lang]: e.target.value })}
          />
        </div>
        <div
          style={{
            width: "100%",
            border: "1px solid #bbb",
            borderRadius: "5px",
            padding: "5px 10px 5px 10px",
          }}
        >
          <Markdown>{intro}</Markdown>
        </div>
      </Stack>
      <div style={{ fontSize: "80%" }}>
        <br />
        <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank">
          Markdown
        </a>{" "}
        allowed, e.g. *<i>italic</i>*, **<b>bold</b>**, links, etc. Live preview
        shown alongside.
      </div>
    </>
  );
}

"use client";
import React from "react";

import { Container } from "@mui/material";

export default function About() {
  return (
    <Container sx={{ my: 2 }}>
      <style jsx>
        {`
          li {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
        `}
      </style>
      <h1>About</h1>
      <p>More info coming soon.</p>
      <h2>Acknowledgements</h2>
      <p>This project was made possible by the following resources:</p>
      <ul>
        <li>
          <b>Japanese</b>
          <ul>
            <li>TODO</li>
          </ul>
        </li>
        <li>
          <b>Sounds</b>
          <ul>
            <li>
              The &quot;correct&quot;, &quot;incorrect&quot; and
              &quot;listen&quot; sounds are by{" "}
              <a href="https://freesound.org/people/Bertrof/">Bertrof</a> on
              freesound.org (CC BY 3.0).
            </li>
          </ul>
        </li>
      </ul>
    </Container>
  );
}

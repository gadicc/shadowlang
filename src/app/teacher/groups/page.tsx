"use client";
import React from "react";

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
  TextField,
} from "@mui/material";
import {
  db,
  useGongoLive,
  useGongoSub,
  useGongoUserId,
} from "gongo-client-react";

export default function TeacherGroups() {
  const userId = useGongoUserId() as string | null;
  useGongoSub("userGroupsForTeacher", { userId });
  const groups = useGongoLive((db) =>
    db.collection("userGroups").find({ userId }),
  );
  const [newGroupTitle, setNewGroupTitle] = React.useState("New Group");
  const [newGroupPassword, setNewGroupPassword] = React.useState("letmein");

  if (!userId) return "Log-in first";

  return (
    <Container sx={{ my: 2 }}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Credentials</TableCell>
              <TableCell align="right"># Users</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow
                key={group._id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {group.title.en}
                </TableCell>
                <TableCell component="th" scope="row">
                  Group ID: {group._id}
                  <br />
                  Password: {group.password}
                </TableCell>
                <TableCell align="right">{group.userCount}</TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <TextField
                  size="small"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                />
              </TableCell>
              <TableCell component="th" scope="row">
                <TextField
                  size="small"
                  value={newGroupPassword}
                  onChange={(e) => setNewGroupPassword(e.target.value)}
                />
              </TableCell>

              <TableCell align="right">
                {" "}
                <Button
                  onClick={() => {
                    db.collection("userGroups").insert({
                      userId,
                      title: { en: newGroupTitle },
                      password: newGroupPassword,
                      createdAt: new Date(),
                      __ObjectIDs: ["_id", "userId"],
                    });
                    setNewGroupTitle("New Group");
                  }}
                >
                  Add
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

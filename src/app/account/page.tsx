"use client";
import React from "react";
import { Button, Container, TextField, Typography } from "@mui/material";
import {
  db,
  useGongoOne,
  useGongoSub,
  useGongoUserId,
} from "gongo-client-react";
import { User } from "@/schemas";
import { WithId } from "gongo-client/lib/browser/Collection";

function GroupLine({ groupId }: { groupId: string }) {
  const group = useGongoOne((db) =>
    db.collection("userGroups").find({ _id: groupId }),
  );

  if (!group) return <li>{groupId}</li>;

  return <li>{group.title.en}</li>;
}

function MyGroups({ userId, user }: { userId: string; user: WithId<User> }) {
  const [groupId, setGroupId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <>
      <Typography variant="h5">My Groups</Typography>
      <ol>
        {user.groupIds?.map((groupId) => (
          <GroupLine key={groupId} groupId={groupId} />
        ))}
      </ol>
      <p>
        If you were provided with a Group ID and Password (e.g. via Patreon),
        enter them here to join the group.
      </p>
      <form style={{ marginBottom: "1em" }}>
        <TextField
          label="Group ID"
          size="small"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        />{" "}
        <TextField
          label="Password"
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />{" "}
        <Button
          disabled={fetching}
          variant="contained"
          type="submit"
          onClick={async (e) => {
            e.preventDefault();
            setFetching(true);
            setError(null);
            if (!userId) return;
            const result = (await db.call("joinPrivateGroup", {
              userId,
              groupId,
              password,
            })) as unknown as string;
            setFetching(false);
            if (result === "SUCCESS") {
              const __ObjectIDs = user.__ObjectIDs as string[];
              if (!__ObjectIDs.includes("groupIds[]"))
                __ObjectIDs.push("groupIds[]");
              db.collection("users")._update(userId, {
                ...user,
                groupIds: [...(user.groupIds || []), groupId],
                __ObjectIDs,
              });
              setGroupId("");
              setPassword("");
            } else {
              setError(result);
            }
          }}
        >
          Join
        </Button>
      </form>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </>
  );
}

export default function Account() {
  const userId = useGongoUserId() as string | null;
  const user = useGongoOne((db) =>
    db.collection("users").find({ _id: userId }),
  );
  useGongoSub("userGroups");

  if (!userId || !user) return "Log-in first";
  const isTeacher = !!user?.teacher;

  return (
    <Container sx={{ my: 2 }}>
      <MyGroups userId={userId} user={user} />

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

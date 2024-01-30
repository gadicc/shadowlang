"use client";

import React from "react";
// import { t, Trans } from "@lingui/macro";
import {
  db,
  useGongoUserId,
  useGongoOne,
  useGongoSub,
  useGongoLive,
} from "gongo-client-react";

import {
  Box,
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
  Typography,
} from "@mui/material";
import { TableVirtuoso, TableComponents } from "react-virtuoso";

import { User } from "@/schemas";

const VirtuosoTableComponents: TableComponents<User> = {
  // eslint-disable-next-line react/display-name
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{ borderCollapse: "separate", tableLayout: "fixed" }}
    />
  ),
  TableHead,
  TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
  // eslint-disable-next-line react/display-name
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

function fixedHeaderContent() {
  const sx = {
    backgroundColor: "background.paper",
  };
  return (
    <TableRow>
      <TableCell sx={sx} variant="head">
        User
      </TableCell>
    </TableRow>
  );
}

function rowContent(_index: number, user: User) {
  /*
  function onClick(userId: string, field: string, oldValue: number) {
    return function () {
      const textValue = prompt("New Value?  Was: " + oldValue);
      if (!textValue) return alert("Invalid value");
      const newValue = parseFloat(textValue);
      const query = { $set: { [field]: newValue } };
      db.collection("users").update(userId, query);
    };
  }
  */

  return (
    <React.Fragment>
      <TableCell component="th" scope="row">
        {user.displayName}
        {user.username && " (" + user.username + ")"}
        <br />
        {user.emails?.[0]?.value}
      </TableCell>
    </React.Fragment>
  );
}

function Users() {
  const sub = useGongoSub(
    "usersForAdmin",
    {},
    {
      sort: ["__updatedAt", "desc"],
      limit: 5000,
      minInterval: 5_000,
      maxInterval: 10_000,
      // persist: false,
    },
  );
  const [filter, setFilter] = React.useState("");
  const _users = useGongoLive((db) => db.collection("users").find());
  const users = React.useMemo(() => {
    const re = new RegExp(filter, "i");
    return _users.filter((user) => {
      if (!filter) return true;
      if (re.test(user.displayName)) return true;
      for (const email of user.emails) if (re.test(email.value)) return true;
      if (user.username && re.test(user.username)) return true;
      return false;
    });
  }, [_users, filter]);

  return (
    <Box>
      <Typography variant="h6">Users</Typography>
      <TextField
        size="small"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      <p>Total users: {users.length}</p>
      {sub.isMore && <Button onClick={sub.loadMore}>Load More</Button>}

      <Paper style={{ height: "80vh", width: "100%" }}>
        <TableVirtuoso
          data={users}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={rowContent}
        />
      </Paper>
    </Box>
  );
}

export default function Admin() {
  const userId = useGongoUserId();
  const user = useGongoOne((db) =>
    db.collection("users").find({ _id: userId }),
  );

  React.useEffect(() => {
    // @ts-expect-error: todo
    const pollInterval = db.transport.options.pollInterval;
    // @ts-expect-error: todo
    db.transport.options.pollInterval = 1000;
    // @ts-expect-error: todo
    return () => (db.transport.options.pollInterval = pollInterval);
  }, []);

  if (!(user && user.admin)) return <div>Access Denied.</div>;

  return (
    <Container maxWidth="lg" sx={{ my: 2 }}>
      <Users />
    </Container>
  );
}

"use client";
import * as React from "react";
import { useGongoOne, useGongoUserId } from "gongo-client-react";
import { signIn } from "next-auth/react";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Menu,
} from "@mui/material";
import { Menu as MenuIcon, AccountCircle } from "@mui/icons-material";

export default function MyAppBar() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const userId = useGongoUserId();
  const user = useGongoOne((db) =>
    db.collection("users").find({ _id: userId }),
  );

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Photos
        </Typography>
        {userId ? (
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar
                alt={
                  typeof user?.displayName === "string"
                    ? user.displayName
                    : "avatar"
                }
                src={
                  /* @ts-expect-error: TODO */
                  user.photos[0].value
                }
                imgProps={{ referrerPolicy: "no-referrer" }}
              />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleClose}>My account</MenuItem>
            </Menu>
          </div>
        ) : (
          <Button
            variant="text"
            sx={{ color: "white" }}
            onClick={() => signIn()}
          >
            LOGIN
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

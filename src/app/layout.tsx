import React from "react";
import type { Metadata, Viewport } from "next";

// or `v1X-appRouter` if you are using Next.js v1X
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { Container } from "@mui/material";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import ClientProviders from "./clientProviders";
import MyAppBar from "./MyAppBar";
import "../db";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CssBaseline />
        <AppRouterCacheProvider>
          <ClientProviders>
            <MyAppBar />
            {children}
          </ClientProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

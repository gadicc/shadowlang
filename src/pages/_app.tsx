import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

import "../db";

// export default function App({ Component, pageProps }: AppProps) {
export default function App(props: AppProps) {
  const {
    Component,
    // emotionCache = csEmotionCache[dir],
    pageProps: { session, ...pageProps },
  } = props;

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

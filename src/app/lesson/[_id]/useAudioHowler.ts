import React from "react";
import { Howl, Howler } from "howler";

import type { Word } from "./TextBlock";

export default function useAudioHowler(
  audioSrc: string,
  words: Word[],
  start: number,
  end: number,
  avatarRef?: React.RefObject<HTMLDivElement>,
  eventDone?: (event: string) => void,
  breakpoint?: string,
) {
  // console.log("useAudio");
  const howl = React.useMemo(
    () => new Howl({ src: [audioSrc], format: "m4a" }),
    [audioSrc],
  );

  const [isPlaying, _setIsPlaying] = React.useState(false);
  const isPlayingRef = React.useRef(isPlaying);
  const setIsPlaying = React.useCallback(
    (bool: boolean) => {
      if (bool === isPlayingRef.current) return;
      isPlayingRef.current = bool;
      _setIsPlaying(bool);
    },
    [isPlayingRef],
  );

  const startEndRef = React.useRef({ start, end });

  const [playingWordIdx, _setPlayingWordIdx] = React.useState(-1);
  const playingWordIdxRef = React.useRef(playingWordIdx);
  const setPlayingWordIdx = React.useCallback(
    (i: number) => {
      if (i === playingWordIdxRef.current) return;
      playingWordIdxRef.current = i;
      _setPlayingWordIdx(i);
    },
    [playingWordIdxRef],
  );

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const play = () => {
      // console.log(Howler, howl);
      setIsPlaying(true);
      function checkTime() {
        const currentTime = howl.seek();

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (!(word && word.start && word.end)) continue;
          if (currentTime > word.start && currentTime < word.end) {
            if (playingWordIdxRef.current !== i) {
              if (false)
                console.log(
                  "currentTime",
                  currentTime,
                  "prev playingWordIndex",
                  playingWordIdxRef.current,
                  "next playingWordIndex",
                  i,
                );
              setPlayingWordIdx(i);
            }
            break;
          }
        }
      }
      interval = setInterval(checkTime, 50);
    };

    const stop = () => {
      if (interval) clearInterval(interval);
      setIsPlaying(false);
      setPlayingWordIdx(-1);
      if (avatarRef?.current) avatarRef.current.style.boxShadow = "";
      if (eventDone) eventDone("play");
    };

    howl.on("play", play);
    howl.on("end", stop);
    howl.on("stop", stop);
    howl.on("pause", stop);

    return () => {
      howl.off("play", play);
      howl.off("end", stop);
      howl.off("stop", stop);
      howl.off("pause", stop);
    };
  }, [howl, words, setIsPlaying, avatarRef, eventDone, setPlayingWordIdx]);

  // Waveform
  React.useEffect(() => {
    const actx = Howler.ctx; // new AudioContext();

    const bquad = actx.createBiquadFilter();
    bquad.type = "lowpass";
    bquad.frequency.value = 250;

    const analyser = actx.createAnalyser();
    analyser.fftSize = 256;

    // connect nodes: srcNode (input) -> analyzer -> destination (output)
    // @ts-expect-error: ok
    howl._sounds[0]._node.connect(bquad);
    bquad.connect(analyser);

    // srcNode.connect(actx.destination);

    const fftLen = analyser.frequencyBinCount;
    const fft = new Uint8Array(fftLen);

    const avatar = avatarRef?.current;
    if (!avatar) return;
    avatar.style.transitionDuration = ".05s";
    avatar.style.transitionProperty = "box-shadow";

    function render() {
      // This was an easy way to avoid the calcs when not playing, but
      // really we should stop the requestAnimationFrame loop.  TODO.
      if (isPlayingRef.current) {
        // fill FFT buffer
        analyser.getByteFrequencyData(fft);
        // average data from some bands
        const v = (fft[1] + fft[2]) / 512;
        // console.log(v);

        const avatar = avatarRef?.current;
        if (!avatar) return;
        const multiplier = breakpoint === "xs" ? 4 : 8;
        avatar.style.boxShadow =
          "0px 0px 0px " + multiplier * v + "px rgba(100,100,100,0.3)";
      }

      requestAnimationFrame(render);
    }

    render();
  }, [howl, avatarRef, breakpoint]);

  const play = React.useCallback(
    (range?: { start: number; end: number }) => {
      startEndRef.current = range || {
        start: words?.[0].start ?? start,
        end: words.findLast((w) => w.end)?.end ?? end,
      };

      // @ts-expect-error: ok
      howl._sprite.play = [
        startEndRef.current.start * 1000,
        (startEndRef.current.end - startEndRef.current.start) * 1000,
      ];

      howl.play("play");
    },
    [howl, start, end, words],
  );

  return { isPlaying, play, playingWordIdx };
}

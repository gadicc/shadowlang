import React from "react";

import type { Word } from "./TextBlock";

export default function useAudioElement(
  audioRef: React.RefObject<HTMLAudioElement>,
  words: Word[],
  start: number,
  end: number,
  avatarRef?: React.RefObject<HTMLDivElement>,
  eventDone?: (event: string) => void,
  breakpoint?: string,
) {
  // console.log("useAudio");
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

  // Can't play until user has interacted.
  const userInteractionRef = React.useRef(false);

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

  const timeupdate = React.useCallback(
    function timeupdate() {
      const audio = audioRef.current;
      if (!audio) return;

      const currentTime = audio.currentTime;
      // console.log("currentTime", currentTime);

      // Alternatively via setTimeout; each has pros/cons on different devices :(
      if (currentTime >= startEndRef.current.end) {
        audio.pause();
        setIsPlaying(false);
        setPlayingWordIdx(-1);
        if (avatarRef?.current) avatarRef.current.style.boxShadow = "";
        if (eventDone) eventDone("play");
        return;
      }

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
    },
    [
      audioRef,
      words,
      setPlayingWordIdx,
      setIsPlaying,
      avatarRef,
      startEndRef,
      eventDone,
    ],
  );

  React.useEffect(() => {
    const ref = audioRef.current;
    if (!ref) return;

    ref.addEventListener("timeupdate", timeupdate);
    return () => {
      ref.removeEventListener("timeupdate", timeupdate);
    };
  }, [audioRef, timeupdate]);

  const actxRef = React.useRef<AudioContext | null>(null);

  const play = React.useCallback(
    (range?: { start: number; end: number }) => {
      const audio = audioRef.current;
      if (!audio) return;

      // We should probably have an explicit API to set this.
      if (!range) userInteractionRef.current = true;
      // Except now we onClick instead of onMouseOver, so we don't need this.
      // if (!userInteractionRef.current) return;
      // console.log(range);

      startEndRef.current = range || {
        start: words?.[0].start ?? start,
        end: words.findLast((w) => w.end)?.end ?? end,
      };

      /*
      // This maybe works much better than relying on `timeupdate`.
      function timedStop() {
        setTimeout(
          () => {
            audio?.pause();
            audio?.removeEventListener("play", timedStop);
            setIsPlaying(false);
            setPlayingWordIdx(-1);
            if (avatarRef?.current) avatarRef.current.style.boxShadow = "";
          },
          (startEndRef.current.end - startEndRef.current.start) * 1000,
        );
      }
      audio.addEventListener("play", timedStop);
      */

      // --- wave scope start ---
      // Adapted from https://stackoverflow.com/a/37021249/1839099
      // thanks user1693593
      let srcNode: MediaElementAudioSourceNode,
        bquad: BiquadFilterNode,
        analyser: AnalyserNode,
        fft: Uint8Array,
        fftLen: number;

      function setup(this: HTMLAudioElement) {
        if (srcNode || !audio || actxRef.current) return;
        audio.removeEventListener("canplay", setup);

        const actx = (actxRef.current = new AudioContext());

        srcNode = actx.createMediaElementSource(this);

        bquad = actx.createBiquadFilter();
        bquad.type = "lowpass";
        bquad.frequency.value = 250;

        analyser = actx.createAnalyser();
        analyser.fftSize = 256;

        // connect nodes: srcNode (input) -> analyzer -> destination (output)
        srcNode.connect(bquad);
        bquad.connect(analyser);

        srcNode.connect(actx.destination);
        fftLen = analyser.frequencyBinCount;
        fft = new Uint8Array(fftLen);

        const avatar = avatarRef?.current;
        if (!avatar) return;
        avatar.style.transitionDuration = ".05s";
        avatar.style.transitionProperty = "box-shadow";

        render();
      }
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
      if (!actxRef.current) audio.addEventListener("canplay", setup);
      // --- wave scope end ---

      audio.currentTime = startEndRef.current.start;
      // console.log("set currentTime to ", startEndRef.current.start);
      setIsPlaying(true);
      audio.play();
    },
    [audioRef, words, start, setIsPlaying, avatarRef, end, breakpoint],
  );

  return { isPlaying, play, playingWordIdx };
}

import React from "react";
import * as _ from "radash";

import {
  Stack,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  Box,
  InputAdornment,
  IconButton,
} from "@mui/material";

import { jmdict } from "@/dicts";
import {
  JMdictDictionaryMetadata,
  JMdictWord,
} from "@scriptin/jmdict-simplified-types";
import posColors from "@/lib/pos-colors";
import { Delete } from "@mui/icons-material";

interface JmDictModalState {
  kanji?: string;
  kana?: string;
  partsOfSpeech?: string;
}

export function DictionaryEntry({
  entry,
  selected,
  setSelected,
  jmDictMetadata,
}: {
  entry: JMdictWord;
  selected?: boolean;
  setSelected?: (id: string) => void;
  jmDictMetadata: JMdictDictionaryMetadata | null;
}) {
  return (
    <Box
      onClick={() => setSelected && setSelected(entry.id)}
      sx={{
        border: "1px solid #ccc",
        borderRadius: "5px",
        padding: "5px 10px 5px 10px",
        color: "#444",
        fontSize: "80%",
        background: selected ? "#f0f0f0" : "",
        marginBottom: "8px",
        cursor: setSelected ? "pointer" : "default",
      }}
    >
      <div>
        Kanji:
        {entry.kanji.map((kanji, i) => (
          <span
            key={i}
            style={{
              padding: "0 3px 0 3px",
              margin: "0 3px 0 3px",
              background: "#efefef",
              borderRadius: "5px",
            }}
          >
            {kanji.text}
          </span>
        ))}
      </div>
      <div>
        Kana:
        {entry.kana.map((kana, i) => (
          <span
            key={i}
            style={{
              padding: "0 3px 0 3px",
              margin: "0 3px 0 3px",
              background: "#efefef",
              borderRadius: "5px",
            }}
          >
            {kana.text}
          </span>
        ))}
      </div>
      <div>
        <ol style={{ paddingLeft: 16 }}>
          {entry.sense.map((sense, i) => (
            <li key={i}>
              {sense.partOfSpeech.map((pos, j) => (
                <span
                  key={j}
                  title={jmDictMetadata?.tags[pos]}
                  style={{
                    color: "white",
                    backgroundColor: posColors[pos] || "#565656",
                    borderRadius: "5px",
                    padding: "2px 5px 2px 5px",
                    margin: "2px",
                  }}
                >
                  {pos}
                </span>
              ))}
              {sense.misc.map((misc, j) => (
                <span
                  key={j}
                  title={jmDictMetadata?.tags[misc]}
                  style={{
                    color: "white",
                    backgroundColor: "#8a8a91",
                    borderRadius: "5px",
                    padding: "2px 5px 2px 5px",
                    margin: "2px",
                  }}
                >
                  {misc}
                </span>
              ))}
              <ol style={{ paddingLeft: 15 }}>
                {sense.gloss.map((gloss, i) => (
                  <li key={i}>{gloss.text}</li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </div>
    </Box>
  );
}

const JmDictModal = React.memo(function JmDictModal({
  open,
  closeJmDict,
  state,
  mergeAndLookupState,
  isFetching,
  results,
  setJmDictId,
  jmDictMetadata,
}: {
  open: boolean;
  closeJmDict: () => void;
  state: JmDictModalState;
  mergeAndLookupState: (newState: Record<string, unknown>) => void;
  isFetching: boolean;
  results: JMdictWord[];
  setJmDictId: (id: string) => void;
  jmDictMetadata: JMdictDictionaryMetadata | null;
}) {
  const [selected, setSelected] = React.useState<string | null>(
    results.length ? results[0].id : null,
  );
  React.useEffect(() => {
    if (
      !selected ||
      (results.length && !results.find((r) => r.id === selected))
    )
      setSelected(results.length ? results[0].id : null);
  }, [results, selected]);

  return (
    <Dialog
      open={open}
      onClose={closeJmDict}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <DialogTitle>
        <Stack direction="row" spacing={2}>
          <TextField
            id="outlined-basic"
            label="Kanji"
            variant="outlined"
            size="small"
            sx={{ width: "222px" }}
            value={state.kanji || ""}
            onChange={(e) => mergeAndLookupState({ kanji: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear kanji"
                    edge="end"
                    onClick={() => mergeAndLookupState({ kanji: "" })}
                  >
                    <Delete />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            id="outlined-basic"
            label="Kana"
            variant="outlined"
            size="small"
            sx={{ width: "222px" }}
            value={state.kana || ""}
            onChange={(e) => mergeAndLookupState({ kana: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear kana"
                    edge="end"
                    onClick={() => mergeAndLookupState({ kana: "" })}
                  >
                    <Delete />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <CircularProgress
            size="1em"
            variant={isFetching ? "indeterminate" : "determinate"}
            value={isFetching ? undefined : 100}
            sx={{
              marginTop: "auto !important",
              marginBottom: "auto !important",
              opacity: isFetching ? 1 : 0.075,
              color: isFetching ? "#1976d2" : "#555",
            }}
          />
        </Stack>
        <div style={{ fontSize: "65%", fontWeight: "normal" }}>
          Enter either kanji or kana to search, or use both to try find an exact
          match.
        </div>
      </DialogTitle>
      <DialogContent>
        {results.length ? (
          results.map((entry) => (
            <DictionaryEntry
              key={entry.id}
              entry={entry}
              selected={selected === entry.id}
              setSelected={setSelected}
              jmDictMetadata={jmDictMetadata}
            />
          ))
        ) : (
          <span>No results.</span>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={closeJmDict}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!selected}
          onClick={() => {
            if (selected) setJmDictId(selected);
            closeJmDict();
          }}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default function useJmDictModal() {
  const [open, setOpen] = React.useState(false);
  const [state, _setState] = React.useState<JmDictModalState>({});
  const stateRef = React.useRef(state);
  const [isFetching, setIsFetching] = React.useState(false);
  const [results, setResults] = React.useState<JMdictWord[]>([]);
  const [jmDictMetadata, setJmDictMetadata] =
    React.useState<JMdictDictionaryMetadata | null>(null);

  React.useEffect(() => {
    jmdict.getMetadata().then(setJmDictMetadata);
  }, []);

  const lookup = React.useCallback(
    _.debounce({ delay: 750 }, async (state: JmDictModalState) => {
      setIsFetching(true);
      const results = await jmdict.findByKanjiAndKana(
        state.kanji?.trim(),
        state.kana?.trim(),
      );
      console.log(results);
      setResults(results);
      setIsFetching(false);
    }),
    [setIsFetching, setResults, jmdict],
  );

  const mergeAndLookupState = React.useCallback(
    (mergeState: Record<string, unknown>) => {
      const newState = { ...stateRef.current, ...mergeState };
      _setState(newState);
      stateRef.current = newState;
      lookup(newState);
    },
    [lookup, stateRef],
  );

  const openJmDict = React.useCallback(
    function openJmDict(state: Record<string, unknown> = {}) {
      mergeAndLookupState(state);
      setOpen(true);
    },
    [mergeAndLookupState],
  );

  const closeJmDict = React.useCallback(() => setOpen(false), []);

  const jmDictProps = React.useMemo(() => {
    return {
      open,
      closeJmDict,
      state,
      mergeAndLookupState,
      isFetching,
      results,
      jmDictMetadata,
    };
  }, [
    open,
    closeJmDict,
    state,
    mergeAndLookupState,
    isFetching,
    results,
    jmDictMetadata,
  ]);

  return { openJmDict, closeJmDict, JmDictModal, jmDictProps };
}

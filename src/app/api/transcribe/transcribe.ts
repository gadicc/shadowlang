import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

(async function () {
  const output = await replicate.run(
    "thomasmol/whisper-diarization:7fa6110280767642cf5a357e4273f27ec10ebb60c107be25d6e15f928fd03147",
    {
      input: {
        // file_string: "...",
        file_url: "https://www.patreon.com/file?h=95707017&i=17163602",
        group_segments: true,
        // num_speakers: 2, // empty to autodetect
        language: "ja",
        // prompt: "",
        offset_seconds: 0,
      },
    },
  );
  console.log(JSON.stringify(output, null, 2));
})();

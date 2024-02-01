// NB: user authentication!!  only let logged in users upload.

import AWS from "aws-sdk";
import crypto from "crypto";
import sharp from "sharp";
import * as mm from "music-metadata";
import { fileTypeFromBuffer } from "file-type";
import { NextRequest, NextResponse } from "next/server";

import { ObjectId } from "bson";
import gs /* Auth, User, Order,  ObjectId */ from "@/api-lib/db-full";
// import { format } from 'date-fns';

const AWS_S3_BUCKET = "shadowlang";

const defaults = {
  AWS_REGION: "eu-west-3", // Paris
};

const env = process.env;
AWS.config.update({
  accessKeyId: env.AWS_ACCESS_KEY_ID_APP || env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY_APP || env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION_APP || env.AWS_REGION || defaults.AWS_REGION,
});

if (!gs.dba) throw new Error("gs.dba not set");

interface FileError {
  $error: {
    code: string;
    message?: string;
    stack?: string;
  };
}

interface FileEntryBase {
  [key: string]: unknown;
  // _id: string | ObjectId;
  _id: ObjectId;
  filename?: string;
  sha256: string;
  size: number;
  type: string; // "image",
  mimeType?: string;
  createdAt: Date;
}

interface FileEntryOther extends FileEntryBase {
  type: "other";
}

interface FileEntryImage extends FileEntryBase {
  type: "image";
  image: {
    format: sharp.Metadata["format"];
    size?: number;
    width?: number;
    height?: number;
  };
}

interface FileEntryAudio extends FileEntryBase {
  type: "audio";
  audio: mm.IAudioMetadata["format"];
}

type FileEntry = FileEntryAudio | FileEntryImage | FileEntryOther;

const Files = gs.dba.collection<FileEntry>("files");

async function createFileFromBuffer(
  buffer: Buffer,
  {
    filename,
    mimeType,
    size,
    existingId,
    sha256,
    ...extra
  }: {
    filename?: string;
    mimeType?: string;
    size?: number;
    existingId?: string;
    sha256?: string | null;
    extra?: Record<string, unknown>;
  } = {},
) {
  // TODO, check if it's an image.

  const _sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  if (sha256) {
    if (sha256 !== _sha256) {
      return { $error: { code: "SHA256_MISMATCH" } };
    }
  } else {
    sha256 = _sha256;
  }

  size = size || Buffer.byteLength(buffer);
  if (!mimeType) {
    const fileType = await fileTypeFromBuffer(buffer);
    mimeType = fileType ? fileType.mime : "";
  }

  const specific = await (async function () {
    if (mimeType.match(/image/)) {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      return {
        type: "image" as const,
        image: {
          format: metadata.format,
          size: metadata.size,
          width: metadata.width,
          height: metadata.height,
        },
      };
    } else if (mimeType.match(/audio/)) {
      const metadata = await mm.parseBuffer(buffer, mimeType);
      return {
        type: "audio" as const,
        audio: metadata.format,
      };
    } else {
      return { type: "other" as const };
    }
  })();

  const now = new Date();

  const entry: FileEntry = {
    // _id: existingId || new ObjectId(),
    _id: new ObjectId(existingId),
    filename,
    sha256,
    size: size,
    mimeType,
    createdAt: now,
    ...extra,
    ...specific,
  };

  console.log(entry);

  const params = {
    Bucket: AWS_S3_BUCKET,
    Key: sha256,
    Body: buffer,
  };

  // console.log(params);

  const result = await new AWS.S3().putObject(params).promise();
  console.log({ result });

  if (existingId) {
    const $set = (({ _id, ...rest }) => rest)(entry);
    await Files.updateOne({ _id: new ObjectId(existingId) }, { $set });
  } else {
    await Files.insertOne(entry);
  }

  // return [entry, buffer];
  return entry;
}

// shadowlang 2024-02-01
async function POST(req: NextRequest) {
  const formData = await req.formData();
  console.log(formData);

  const sha256 = formData.get("sha256") as string;
  const file = formData.get("file") as File | null;

  if (sha256 && typeof sha256 !== "string") {
    return NextResponse.json({ $error: { code: "INVALID_SHA256" } });
  }
  if (!file) return NextResponse.json({ $error: { code: "ENOENT" } });

  const entry = await createFileFromBuffer(
    Buffer.from(await file.arrayBuffer()),
    {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      sha256,
    },
  );

  console.log(entry);
  return NextResponse.json(entry);
}
async function GET(req: NextRequest) {
  const sha256 = req.nextUrl.searchParams.get("sha256");
  const returnType = req.nextUrl.searchParams.get("return");

  if (!sha256) return NextResponse.json({ $error: { code: "INVALID_SHA256" } });

  const entry = await Files.findOne({ sha256 });
  if (!entry)
    return returnType === "meta"
      ? NextResponse.json({ $error: { code: "ENOENT" } })
      : new Response("Not Found", { status: 404 });

  // TODO, cache?
  if (returnType === "meta") return NextResponse.json(entry);

  /*
  if (entry.sha256 === req.headers.get("if-none-match")) {
    // TODO caching
    // Note that the server generating a 304 response MUST generate any of
    // the following header fields that would have been sent in a 200 (OK)
    // response to the same request: Cache-Control, Content-Location, Date,
    // ETag, Expires, and Vary.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
    resHeaders(res, file);
    res.status(304).end();
  }
  */

  const params = {
    Bucket: AWS_S3_BUCKET,
    Key: entry.sha256,
  };

  const result = await new AWS.S3().getObject(params).promise();
  console.log({ result });

  // TODO consider access control, ability to remove files, etc.
  const headers = new Headers({
    "Cache-Control": "public,max-age=31536000,immutable",
    ETag: "entry.sha256",
  });
  if (entry.mimeType) headers.set("Content-Type", entry.mimeType);
  if (entry.size) headers.set("Content-Length", entry.size.toString());
  if (entry.filename)
    headers.set("Content-Disposition", `inline; filename="${entry.filename}"`);

  return new Response(result.Body as Buffer, { status: 200, headers });
}

export type { FileEntry, FileError };
export { POST, GET, createFileFromBuffer };

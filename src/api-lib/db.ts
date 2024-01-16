import GongoServer from "gongo-server/lib/serverless";
import MongoDBA from "gongo-server-db-mongo";
import Auth from "gongo-server/lib/auth-class";
import Database from "gongo-server-db-mongo";
import MongoClient from "mongodb-rest-relay/lib/client";
import { ObjectId } from "./objectId.js";

import type { User as _User } from "../schemas";

// Can't omit on type with index signature, have to remap.
// export type User = Omit<_User, "_id"> & { _id: ObjectId };
type FixClientSchema<T> = {
  [K in keyof T as K extends "_id" ? never : K]: T[K];
} & { _id: ObjectId };

type User = FixClientSchema<_User>;

// const env = process.env;
// const MONGO_URL = env.MONGO_URL || "mongodb://127.0.0.1";

const dbName = "shadowlang";

const MONGO_URL =
  "http" +
  (process.env.NODE_ENV === "production"
    ? "s://shadowlang.vercel.app"
    : "://localhost:3008") +
  "/api/mongoRelay";

const gs = new GongoServer({
  // dba: new MongoDBA(MONGO_URL, "sd-mui"),
  // @ts-expect-error: ok
  dba: new MongoDBA(MONGO_URL, dbName, MongoClient),
});

const db = gs.dba;
const dba = gs.dba;

export type { User };
export { db, dba, Auth, Database };
export default gs;

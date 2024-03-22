import { GongoDocument } from "gongo-server-db-mongo/lib/collection";

export interface UserGroup extends GongoDocument {
  _id?: string;
  userId: string;
  title: { [lang: string]: string };
  password: string;
  userCount?: number;
  createdAt: Date;
}

import gs from "../../api-lib/db";
import {
  GongoDocument,
  CollectionEventProps,
  userIsAdmin,
  // userIdMatches,
} from "gongo-server-db-mongo/lib/collection";
import { ChangeSetUpdate } from "gongo-server/lib/DatabaseAdapter";
import { NextApiRequest, NextApiResponse } from "next";
// import { ipFromReq, ipPass } from "../../src/api-lib/ipCheck";
// import { ObjectId } from "bson";

export const config = {
  runtime: "edge",
  // regions: ['iad1'],
};

// gs.db.Users.ensureAdmin("dragon@wastelands.net", "initialPassword");
/*
gs.publish("accounts", (db) =>
  db.collection("accounts").find({ userId: { $exists: false } })
);
*/

gs.publish("user", async (db, _opts, { auth, updatedAt }) => {
  const userId = await auth.userId();
  if (!userId) return [];

  const fullUser = await db.collection("users").findOne({ _id: userId });
  if (!fullUser || fullUser.__updatedAt === updatedAt.users) return [];

  const user = { ...fullUser };
  delete user.services;
  delete user.password;

  return [
    {
      coll: "users",
      entries: [user],
    },
  ];
});

if (gs.dba) {
  const db = gs.dba;

  const users = db.collection("users");
  users.allow(
    "update",
    async (
      doc: GongoDocument | ChangeSetUpdate | string,
      eventProps: CollectionEventProps,
    ) => {
      const isAdmin = await userIsAdmin(doc, eventProps);
      if (isAdmin === true) return true;

      if (typeof doc === "object" && "patch" in doc) {
        if (doc.patch.length === 1) {
          if (doc.patch[0].path === "/dob") {
            // Ok for now
            return true;
          }
        }
      }

      return "ACCESS_DENIED";
    },
  );
}

// module.exports = gs.expressPost();
const gsExpressPost =
  config.runtime === "edge" ? gs.vercelEdgePost() : gs.expressPost();
async function gongoPoll(req: NextApiRequest, res: NextApiResponse) {
  /*
  if (
    process.env.NODE_ENV === "production" &&
    !(await ipPass(ipFromReq(req)))
  ) {
    res.status(403).end("IP not allowed");
    return;
  }
  */

  // @ts-expect-error: TODO
  return gsExpressPost(req, res);
}
module.exports = gongoPoll;

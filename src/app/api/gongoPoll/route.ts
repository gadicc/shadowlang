import gs from "../../../api-lib/db";
import {
  GongoDocument,
  CollectionEventProps,
  userIsAdmin,
  userIdMatches,
  // userIdMatches,
} from "gongo-server-db-mongo/lib/collection";
import { ChangeSetUpdate } from "gongo-server/lib/DatabaseAdapter";
// import { ipFromReq, ipPass } from "../../src/api-lib/ipCheck";
import { ObjectId } from "@/api-lib/objectId";

export const runtime = "edge";

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

gs.publish("usersForAdmin", async (db, _opts, { auth }) => {
  const userId = await auth.userId();
  if (!userId) return [];

  const user = await db.collection("users").findOne({ _id: userId });
  if (!user || !user.admin) return [];

  const query = { _id: { $ne: userId } };

  return await db.collection("users").find(query).project({
    _id: true,
    emails: true,
    username: true,
    displayName: true,
    credits: true,
    admin: true,
    teacher: true,
    groupsIds: true,
    createdAt: true,
    __updatedAt: true,
  });
});

gs.publish("speakers", (db) => db.collection("speakers").find());

gs.publish("userGroups", async (db, opts, { auth }) => {
  const userId = await auth.userId();
  if (!userId) return [];

  const user = await db.collection("users").findOne({ _id: userId });
  if (!user) return [];

  const query = { _id: { $in: user.groupIds || [] } };
  return await db.collection("userGroups").find(query);
});

gs.publish("userGroupsForTeacher", async (db, opts, { auth }) => {
  console.log({ opts });
  if (opts.userId === undefined)
    throw new Error("userGroups publish requires userId in opts");
  if (!opts.userId) return [];

  const userId = await auth.userId();
  if (!userId || !userId.equals(opts.userId)) return [];

  const query = { userId };
  const groups = await db.collection("userGroups").find(query).toArray();

  const RealUsersColl = await db.collection("users").getReal();
  for (const group of groups) {
    group.userCount = await RealUsersColl.countDocuments({
      groupIds: group._id,
    });
  }

  return [
    {
      coll: "userGroups",
      entries: groups,
    },
  ];
});

gs.method(
  "joinPrivateGroup",
  async (db, { userId, groupId, password }, { auth }) => {
    const realUserId = await auth.userId();
    if (!realUserId || !realUserId.equals(userId)) return "USERID_MISMATCH";

    if (typeof groupId !== "string" || groupId.length !== 24)
      return "INVALID_GROUPID";

    const realGroupId = new ObjectId(groupId);
    const group = await db
      .collection("userGroups")
      .findOne({ _id: realGroupId });
    if (!group) return "NO_SUCH_GROUP";

    if (group.password !== password) return "INCORRECT_PASSWORD";

    await db
      .collection("users")
      .updateOne({ _id: realUserId }, { $addToSet: { groupIds: realGroupId } });

    return "SUCCESS";
  },
);

gs.publish("lesson", async (db, { _id }: { _id: string }) => {
  // TODO, only public lessons, or lessons belonging to the user, or admin
  return db.collection("lessons").find({ _id: new ObjectId(_id) });
});

gs.publish("lessons", async (db, opts, { auth }) => {
  // Note, lesson stores userId as string.  Mmm.
  const realUserId = await auth.userId();
  const strUserId = realUserId?.toString();
  const reqUserId = opts?.userId;
  let query: Record<string, unknown> = { public: true };
  if (reqUserId === "all") {
    if (!realUserId) return [];
    const user = await db.collection("users").findOne({ _id: realUserId });
    if (user?.admin) delete query.public;
  } else if (reqUserId === strUserId)
    query = { $or: [query, { userId: reqUserId }] };
  else if (reqUserId) query.userId = reqUserId;

  // console.log({ strUserId, reqUserId, query });

  // Mmm, we can't just query { public: true } because what if the user has
  // a persisted lesson that WAS public but is now private?  For now let's
  // just query all lessons and filter.
  //
  // Need to think if it's better to send the client all the non-public stubs,
  // or for client to send a list of all it's lessons and have server tell it
  // what to delete.
  const results = await db.collection("lessons").find(query).toArray();
  return [
    {
      coll: "lessons",
      entries: results.map((lesson) =>
        lesson.public || lesson.userId === strUserId
          ? lesson
          : {
              _id: lesson._id,
              public: false,
              __updatedAt: lesson.__updatedAt,
            },
      ),
    },
  ];

  // return db.collection("lessons").find({ userId });
});

gs.publish("transcriptions", async (db, { audioSHA256 }) => {
  return db.collection("transcriptions").find({ audioSHA256 });
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

          if (doc.patch[0].patch === "/teacher") {
            return true;
          }
        }
      }

      return "ACCESS_DENIED";
    },
  );

  const speakers = db.collection("speakers");
  speakers.allow("insert", userIdMatches);
  speakers.allow("update", userIdMatches);
  speakers.allow("remove", userIdMatches);

  const lessons = db.collection("lessons");
  lessons.allow("insert", userIdMatches);
  lessons.allow("update", userIdMatches);
  lessons.allow("remove", userIdMatches);

  const userGroups = db.collection("userGroups");
  userGroups.allow("insert", userIdMatches);
  userGroups.allow("update", userIdMatches);
  userGroups.allow("remove", userIdMatches);
}

// module.exports = gs.expressPost();
const gsExpressPost =
  runtime === "edge" ? gs.vercelEdgePost() : gs.expressPost();

/*
async function gongoPoll(req: Request) {
  /*
  if (
    process.env.NODE_ENV === "production" &&
    !(await ipPass(ipFromReq(req)))
  ) {
    res.status(403).end("IP not allowed");
    return;
  }
  */ /*

  // @ ts-expect-error: TODO
  return gsExpressPost(req, res);
}
*/

export const POST = gsExpressPost;

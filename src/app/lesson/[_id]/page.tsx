import React from "react";
import lesson from "@/assets/op-jp-ab-1.json";
import { _id } from "../../../api-lib/gongoAuthAdapter";

export default function LessonId({
  params: { _id },
}: {
  params: { _id: string };
}) {
  return <div>{_id}</div>;
}

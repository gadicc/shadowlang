import React from "react";
import lesson from "@/assets/op-jp-ab-1.json";

export default function LessonId(props) {
  const { params } = props;
  const { _id } = params;

  return <div>{JSON.stringify(props)}</div>;
}

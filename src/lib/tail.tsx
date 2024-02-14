export default function Tail({ width = 8 }: { width?: number }) {
  const height = (width / 8) * 13;

  return (
    <span
      data-icon="tail-in"
      style={{
        left: -width, // LTR
        color: "white",
        position: "absolute",
        top: 0,
        display: "block",
        width,
        height,
      }}
    >
      <TailSVG width={width} height={height} />
    </span>
  );
}

export function TailSVG({
  width = 8,
  height = 13,
}: {
  width: number;
  height: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      width={width}
      preserveAspectRatio="xMidYMid meet"
      className=""
      version="1.1"
      x="0px"
      y="0px"
      enableBackground={`new 0 0 ${width} ${height}}`}
      style={{ position: "absolute", top: 0, zIndex: 0 }}
    >
      <title>tail-in</title>
      <path
        opacity="0.13"
        fill="#000000"
        d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"
      ></path>
      <path
        fill="currentColor"
        d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"
      ></path>
    </svg>
  );
}

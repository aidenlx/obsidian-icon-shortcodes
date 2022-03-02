import React, { useState, useEffect } from "react";
import type { HTMLProps } from "react";

import * as svgSources from "react-loading/lib/svg";

type LoadingType =
  | "blank"
  | "balls"
  | "bars"
  | "bubbles"
  | "cubes"
  | "cylon"
  | "spin"
  | "spinningBubbles"
  | "spokes";

export interface LoadingProps extends HTMLProps<HTMLDivElement> {
  color?: string;
  /** in milisecond */
  delay?: number;
  type?: LoadingType;
  height?: string | number;
  width?: string | number;
}

const Loading = ({
  color = "var(--interactive-accent)",
  delay = 0,
  type = "balls",
  height = 64,
  width = 64,
  ...restProps
}: LoadingProps) => {
  const [delayed, setDelayed] = useState(delay > 0);
  useEffect(() => {
    let timeout = -1;
    if (delayed) {
      timeout = window.setTimeout(() => setDelayed(false), delay);
    }
    return () => clearTimeout(timeout);
  }, []);
  const selectedType = delayed ? "blank" : type;
  return (
    <div
      style={{
        fill: color,
        height,
        width,
      }}
      dangerouslySetInnerHTML={{ __html: svgSources[selectedType] }}
      {...restProps}
    />
  );
};
export default Loading;

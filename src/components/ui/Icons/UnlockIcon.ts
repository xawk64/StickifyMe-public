import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  filled?: boolean;
  size?: number;
  height?: number;
  width?: number;
  label?: string;
}

export const UnLockIcon: React.FC<IconProps> = ({
  fill,
  filled,
  size,
  height,
  width,
  label,
  ...props
}) => {
  return React.createElement(
    "svg",
    {
      ...props,
      xmlns: "http://www.w3.org/2000/svg",
      width: size || width || 24,
      height: size || height || 24,
      viewBox: "0 0 24 24",
    },
    React.createElement(
      "g",
      { transform: "translate(3.5 2)" },
      React.createElement("path", {
        d: "M8.927,3.237A4.562,4.562,0,0,0,0,4.484V6.653",
        transform: "translate(3.849 0.75)",
        fill: "none",
        stroke: fill,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: "10",
        strokeWidth: "1.5",
      }),
      React.createElement("path", {
        d: "M.5,0V2.221",
        transform: "translate(7.91 12.156)",
        fill: "none",
        stroke: fill,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: "10",
        strokeWidth: "1.5",
      }),
      React.createElement("path", {
        d: "M7.66,0C1.915,0,0,1.568,0,6.271s1.915,6.272,7.661,6.272,7.661-1.568,7.661-6.272S13.406,0,7.66,0Z",
        transform: "translate(0.75 6.824)",
        fill: "none",
        stroke: fill,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: "10",
        strokeWidth: "1.5",
      })
    )
  );
};

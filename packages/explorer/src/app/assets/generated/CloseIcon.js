import * as React from "react";
const SvgCloseIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <g
      stroke="#192431"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path d="m15.625 4.375-11.25 11.25M15.625 15.625 4.375 4.375" />
    </g>
  </svg>
);
export default SvgCloseIcon;

import * as React from "react";
const SvgAddIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <g stroke="#ABAFC7" strokeWidth={1.5}>
      <path
        strokeMiterlimit={10}
        d="M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.875 10h6.25M10 6.875v6.25"
      />
    </g>
  </svg>
);
export default SvgAddIcon;

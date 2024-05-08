import * as React from "react";
const SvgNewQuery = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <path
      stroke="#EC4525"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6.25 3.125c-5 0 0 6.875-5 6.875 5 0 0 6.875 5 6.875M13.75 3.125c5 0 0 6.875 5 6.875-5 0 0 6.875-5 6.875"
    />
    <path
      fill="#EC4525"
      stroke="#FCFEFF"
      strokeMiterlimit={10}
      strokeWidth={0.8}
      d="M15 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
    />
    <path
      stroke="#FCFEFF"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={0.8}
      d="M15 13.334v3.333M13.333 15h3.334"
    />
  </svg>
);
export default SvgNewQuery;

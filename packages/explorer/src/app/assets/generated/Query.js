import * as React from "react";
const SvgQuery = (props) => (
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
      <path d="M6.25 3.125c-5 0 0 6.875-5 6.875 5 0 0 6.875 5 6.875M13.75 3.125c5 0 0 6.875 5 6.875-5 0 0 6.875-5 6.875" />
    </g>
  </svg>
);
export default SvgQuery;

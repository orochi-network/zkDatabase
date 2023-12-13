import * as React from "react";
const SvgDatabaseIcon = (props) => (
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
      <path d="M3.125 10v3.75c0 2.07 3.078 3.75 6.875 3.75s6.875-1.68 6.875-3.75V10" />
      <path d="M3.125 6.25V10c0 2.07 3.078 3.75 6.875 3.75s6.875-1.68 6.875-3.75V6.25" />
      <path d="M10 10c3.797 0 6.875-1.679 6.875-3.75 0-2.071-3.078-3.75-6.875-3.75S3.125 4.179 3.125 6.25C3.125 8.321 6.203 10 10 10" />
    </g>
  </svg>
);
export default SvgDatabaseIcon;

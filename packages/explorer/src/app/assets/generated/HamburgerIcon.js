import * as React from "react";
const SvgHamburgerIcon = (props) => (
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
      <path d="M3.125 10h13.75M3.125 5h13.75M3.125 15h13.75" />
    </g>
  </svg>
);
export default SvgHamburgerIcon;

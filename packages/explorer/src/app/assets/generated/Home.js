import * as React from "react";
const SvgHome = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <path
      stroke="#192431"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M11.875 16.25V12.5a.625.625 0 0 0-.625-.625h-2.5a.625.625 0 0 0-.625.625v3.75a.625.625 0 0 1-.625.625H3.75a.625.625 0 0 1-.625-.625V9.023a.648.648 0 0 1 .203-.46l6.25-5.68a.625.625 0 0 1 .844 0l6.25 5.68a.648.648 0 0 1 .203.46v7.227a.625.625 0 0 1-.625.625H12.5a.625.625 0 0 1-.625-.625"
    />
  </svg>
);
export default SvgHome;

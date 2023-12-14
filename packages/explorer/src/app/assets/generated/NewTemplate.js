import * as React from "react";
const SvgNewTemplate = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <path
      stroke="#ABAFC7"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M11.875 2.5v4.375h4.375M11.563 10l1.874 1.875-1.874 1.875M8.438 10l-1.876 1.875 1.875 1.875"
    />
    <path
      stroke="#ABAFC7"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15.625 17.5a.624.624 0 0 0 .625-.625v-10L11.875 2.5h-7.5a.625.625 0 0 0-.625.625v13.75a.625.625 0 0 0 .625.625z"
    />
  </svg>
);
export default SvgNewTemplate;

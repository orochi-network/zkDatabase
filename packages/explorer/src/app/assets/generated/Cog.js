import * as React from "react";
const SvgCog = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    {...props}
  >
    <g
      stroke="#FCFEFF"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path d="M10 13.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5" />
      <path d="M15.422 6.305c.188.269.353.554.492.851l2.024 1.125a7.97 7.97 0 0 1 .007 3.438l-2.03 1.125c-.14.297-.305.582-.493.851l.039 2.32a8.124 8.124 0 0 1-2.976 1.727l-1.993-1.195a6.91 6.91 0 0 1-.984 0l-1.984 1.187a8.015 8.015 0 0 1-2.985-1.718l.04-2.313a6.252 6.252 0 0 1-.493-.86L2.063 11.72a7.969 7.969 0 0 1-.008-3.438l2.031-1.125a5.75 5.75 0 0 1 .492-.851l-.039-2.32a8.125 8.125 0 0 1 2.977-1.727l1.992 1.195c.328-.023.657-.023.984 0l1.985-1.187a8.015 8.015 0 0 1 2.984 1.718z" />
    </g>
  </svg>
);
export default SvgCog;

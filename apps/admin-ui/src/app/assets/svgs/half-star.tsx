import * as React from "react";

const HalfStar = (props: any) => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Left filled half */}
    <path
      d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21L12 17.77V2Z"
      fill="#FFD700"
    />

    {/* Full star outline */}
    <path
      d="M12 2L14.91 8.26L22 9.27L17 14.14L18.18 21L12 17.77L5.82 21L7 14.14L2 9.27L9.09 8.26L12 2Z"
      stroke="#FFD700"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  </svg>
);

export default HalfStar;

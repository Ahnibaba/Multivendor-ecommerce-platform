import * as React from "react";

const ELogo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      viewBox="0 0 24 24"
    >
      {/* Background square */}
      <rect width="24" height="24" rx="6" fill="#2563EB" />

      {/* Stylized E */}
      <path
        fill="white"
        d="M7 6h10v2H7V6zm0 5h10v2H7v-2zm0 5h10v2H7v-2z"
      />
    </svg>
  );
};

export default ELogo;

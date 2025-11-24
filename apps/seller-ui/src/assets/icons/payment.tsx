import * as React from "react";

const Payment = ({ size = 26, color = "currentColor" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
    >
      <path
        fill={color}
        d="M19 7h-1V6a3 3 0 0 0-3-3H6A3 3 0 0 0 3 6v12a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3v-7a4 4 0 0 0-4-4zm-4-2a1 1 0 0 1 1 1v1H6a1 1 0 0 1-1-1v-.5A1.5 1.5 0 0 1 6.5 4H15zM21 11v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a3 3 0 0 0 1 .2h13a2 2 0 0 1 2 2zm-4 3.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3z"
      />
    </svg>
  );
};

export default Payment;

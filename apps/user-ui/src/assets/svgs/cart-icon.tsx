import * as React from "react";

const CartIcon = (props: any) => (
  <svg
    width={25}
    height={25}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3 3H5L6.68 14.39C6.78288 15.0923 7.13267 15.7347 7.66646 16.2085C8.20025 16.6823 8.88467 16.9619 9.6 17H18.3C19.0153 16.9619 19.6998 16.6823 20.2336 16.2085C20.7673 15.7347 21.1171 15.0923 21.22 14.39L22 8H6"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx={9}
      cy={21}
      r={1}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx={18}
      cy={21}
      r={1}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CartIcon;

import * as React from "react";

const ProfileIcon = (props: any) => (
  <svg
    width={20}
    height={23}
    viewBox="0 0 17 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Head */}
    <circle
      cx={8.57894}
      cy={5.77803}
      r={4.77803}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Shoulders / body */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.00002 17.2014C0.998732 16.8655 1.07385 16.5337 1.2197 16.2311C1.67736 15.3158 2.96798 14.8307 4.03892 14.611C4.81128 14.4462 5.59431 14.336 6.38217 14.2815C7.84084 14.1533 9.30793 14.1533 10.7666 14.2815C11.5545 14.336 12.3375 14.4462 13.1099 14.611C14.1808 14.8307 15.4714 15.3158 15.9291 16.2311C16.075 16.5337 16.1501 16.8655 16.1488 17.2014C16.1467 18.2408 15.2973 19.0438 14.258 19.0438H2.89082C1.85152 19.0438 1.0021 18.2408 1.00002 17.2014Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ProfileIcon;

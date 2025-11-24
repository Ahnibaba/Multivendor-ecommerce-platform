import * as React from "react";

type Props = {
  size?: number;
  color?: string;
  variant?: "outline" | "filled";
  className?: string;
};

export default function DashboardIcon({
  size = 24,
  color = "currentColor",
  variant = "outline",
  className,
}: Props) {
  if (variant === "filled") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        role="img"
        aria-label="Dashboard"
      >
        <rect width="20" height="20" x="2" y="2" rx="3" fill={color} />
        <rect x="4" y="4" width="8" height="8" rx="2" fill="white" />
        <rect x="14" y="4" width="6" height="4" rx="1.5" fill="white" />
        <rect x="14" y="10" width="6" height="8" rx="1.5" fill="white" />
        <rect x="4" y="14" width="8" height="4" rx="2" fill="white" />
      </svg>
    );
  }

  // OUTLINE VERSION
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Dashboard"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="3"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />

      {/* Top-left big section */}
      <rect
        x="4"
        y="4"
        width="8"
        height="8"
        rx="2"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />

      {/* Top-right small analytics block */}
      <rect
        x="14"
        y="4"
        width="6"
        height="4"
        rx="1.5"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />

      {/* Right vertical section */}
      <rect
        x="14"
        y="10"
        width="6"
        height="8"
        rx="1.5"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />

      {/* Bottom-left section */}
      <rect
        x="4"
        y="14"
        width="8"
        height="4"
        rx="2"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />
    </svg>
  );
}

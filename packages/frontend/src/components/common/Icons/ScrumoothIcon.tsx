import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Scrumooth brand mark — composed of three integrated elements:
 *   1. Flowing S-curve — the Scrumooth workflow (Scrum + Smooth)
 *   2. Iteration arc — a subtle 120° right arc representing the Scrum sprint cycle
 *   3. Iteration pulse — a ring + dot at the centre, the living sprint heartbeat
 *
 * Designed for versatile placement: login hero (100px+), sidebar header (40px),
 * page titles, and favicon-scale reproduction (16–32px).
 */
export const ScrumoothIcon: React.FC<IconProps> = ({ size = 40, className, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id="scrumoothGrad"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Iteration arc — a subtle 120° arc wrapping the right side of the mark,
          representing the Scrum sprint cycle that drives the workflow. */}
      <path
        d="M 61 30 A 24 24 0 0 1 61 70"
        stroke="url(#scrumoothGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.28"
      />

      {/* Flowing S-curve — the Scrumooth workflow:
          top arc bulges UP, middle flows through the centre, bottom arc bulges DOWN. */}
      <path
        d="M 70 26 C 70 12 30 12 30 32 C 30 46 50 50 50 50 C 50 50 70 54 70 68 C 70 88 30 88 30 74"
        stroke="url(#scrumoothGrad)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Iteration pulse — a ring + filled dot at the centre of the S,
          the living heartbeat of every Scrum sprint cycle. */}
      <circle
        cx="50"
        cy="50"
        r="6.5"
        stroke="url(#scrumoothGrad)"
        strokeWidth="1.8"
        fill="none"
        opacity="0.5"
      />
      <circle cx="50" cy="50" r="3" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
};

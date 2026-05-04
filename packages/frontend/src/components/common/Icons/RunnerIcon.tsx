import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const RunnerIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="10" cy="4" r="2" fill="currentColor" />
      <path d="M6 22l4-4 4 4" />
      <path d="M10 6l2 6-4 4" />
      <path d="M18 14l-4-2" />
    </svg>
  );
};

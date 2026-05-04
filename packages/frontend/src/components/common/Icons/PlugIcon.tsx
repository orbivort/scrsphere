import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const PlugIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => {
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
      <path d="M12 22v-5" />
      <path d="M15 8V2" />
      <path d="M9 8V2" />
      <path d="M15 8a5 5 0 0 1-5 5 5 5 0 0 1-5-5" />
      <path d="M12 17v-4" />
    </svg>
  );
};

import React from 'react';

import type { IconProps } from './types';

interface PathIconProps extends IconProps {
  path: string;
}

export const PathIcon: React.FC<PathIconProps> = ({ path, size = 24, className, ...props }) => (
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
    {...props}
  >
    <path d={path} />
  </svg>
);

import React from 'react';

import type { IconProps } from './types';

export const SprintIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
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
    <circle cx="12" cy="5" r="3" />
    <path d="M6.5 8h11" />
    <path d="M12 8v5l-3 6" />
    <path d="M12 13l3 6" />
    <path d="M9 15h6" />
  </svg>
);

import React from 'react';

import type { IconProps } from './types';

export const HourglassIcon: React.FC<IconProps> = ({ size = 20, className, style }) => (
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
    style={style}
  >
    <path d="M5 3h14" />
    <path d="M5 21h14" />
    <path d="M17 3v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4V3" />
    <path d="M17 21v-4a4 4 0 0 0-4-4 4 4 0 0 0-4 4v4" />
  </svg>
);

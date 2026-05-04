import React from 'react';

import type { IconProps } from './types';

interface StoryPointsIconProps extends IconProps {
  storyPoints?: number;
}

export const StoryPointsIcon: React.FC<StoryPointsIconProps> = ({
  size = 16,
  storyPoints,
  className,
  ariaLabel = 'Story points',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    {storyPoints !== undefined && (
      <text x="8" y="11" textAnchor="middle" fontSize="7" fill="currentColor">
        {storyPoints}
      </text>
    )}
  </svg>
);

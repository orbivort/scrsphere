import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const IndicatorDotIcon: React.FC<IconProps> = ({ size = 6, className, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 6 6"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="3" cy="3" r="3" fill="currentColor" />
    </svg>
  );
};

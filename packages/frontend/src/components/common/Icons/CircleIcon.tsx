import React from 'react';

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'fill'> {
  size?: number;
  fill?: boolean;
}

export const CircleIcon: React.FC<IconProps> = ({
  size = 24,
  fill = false,
  className,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
};

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const ScrSphereIcon: React.FC<IconProps> = ({ size = 40, className, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id="sphereGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="70%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="47" r="26" fill="url(#sphereGrad)" />
      <path
        d="M 32 38 A 22 22 0 0 1 68 38"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.15"
      />
      <g opacity="0.6">
        <ellipse cx="50" cy="47" rx="20" ry="5" fill="none" stroke="#64748B" strokeWidth="1.5" />
        <ellipse cx="50" cy="47" rx="5" ry="20" fill="none" stroke="#64748B" strokeWidth="1.5" />
        <ellipse
          cx="50"
          cy="47"
          rx="14"
          ry="14"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          transform="rotate(45 50 47)"
        />
        <ellipse
          cx="50"
          cy="47"
          rx="14"
          ry="14"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          transform="rotate(-45 50 47)"
        />
      </g>
      <circle cx="44" cy="43" r="8" fill="none" stroke="#06B6D4" strokeWidth="2.5" />
      <circle cx="56" cy="43" r="8" fill="none" stroke="#8B5CF6" strokeWidth="2.5" />
      <circle cx="50" cy="53" r="8" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
      <circle cx="50" cy="47" r="3.5" fill="#FFFFFF" filter="url(#glow)" />
      <circle cx="32" cy="43" r="1.5" fill="#06B6D4" />
      <circle cx="68" cy="51" r="1.5" fill="#8B5CF6" />
      <circle cx="45" cy="30" r="1.5" fill="#F59E0B" />
      <circle cx="55" cy="66" r="1.5" fill="#06B6D4" />
    </svg>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';

interface SkipLinkProps {
  /** The target element ID to skip to */
  targetId: string;
  /** Link text (default: translated "Skip to main content") */
  text?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Skip navigation link component for keyboard accessibility.
 * Allows keyboard users to skip repetitive navigation and jump directly to main content.
 * Visually hidden until focused.
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, text, className = '' }) => {
  const { t } = useTranslation('common');
  const linkText = text ?? t('aria.skipToMainContent');

  return (
    <a
      href={`#${targetId}`}
      className={`skip-link ${className}`}
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.removeAttribute('tabindex');
        }
      }}
    >
      {linkText}
    </a>
  );
};

export default SkipLink;

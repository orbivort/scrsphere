/**
 * MoscowBadge Component Tests
 *
 * Unit tests for the MoscowBadge component using React Testing Library.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { MoSCoWPriority } from '../../../types';
import { MoscowBadge } from './MoscowBadge';
import styles from './MoscowBadge.module.css';

describe('MoscowBadge', () => {
  it('should render Must Have badge', () => {
    render(<MoscowBadge priority={MoSCoWPriority.MUST_HAVE} />);

    expect(screen.getByText('Must Have')).toBeInTheDocument();
  });

  it('should render Should Have badge', () => {
    render(<MoscowBadge priority={MoSCoWPriority.SHOULD_HAVE} />);

    expect(screen.getByText('Should Have')).toBeInTheDocument();
  });

  it('should render Could Have badge', () => {
    render(<MoscowBadge priority={MoSCoWPriority.COULD_HAVE} />);

    expect(screen.getByText('Could Have')).toBeInTheDocument();
  });

  it("should render Won't Have badge", () => {
    render(<MoscowBadge priority={MoSCoWPriority.WONT_HAVE} />);

    expect(screen.getByText("Won't Have")).toBeInTheDocument();
  });

  it('should render compact badge with short label', () => {
    render(<MoscowBadge priority={MoSCoWPriority.MUST_HAVE} compact />);

    expect(screen.getByText('Must')).toBeInTheDocument();
  });

  it('should apply compact class when compact prop is true', () => {
    const { container } = render(<MoscowBadge priority={MoSCoWPriority.MUST_HAVE} compact />);

    const badge = container.querySelector(`.${styles.compact}`);
    expect(badge).toBeInTheDocument();
  });

  it('should apply CSS custom properties for colors', () => {
    const { container } = render(<MoscowBadge priority={MoSCoWPriority.MUST_HAVE} />);

    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('style');
    const style = badge?.getAttribute('style') || '';
    expect(style).toContain('--badge-color');
    expect(style).toContain('--badge-bg');
  });

  it('should default to Could Have when priority is undefined', () => {
    render(<MoscowBadge priority={undefined as any} />);

    expect(screen.getByText('Could Have')).toBeInTheDocument();
  });
});

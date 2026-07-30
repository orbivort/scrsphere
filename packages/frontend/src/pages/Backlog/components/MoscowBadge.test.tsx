/**
 * MoscowBadge Component Tests
 *
 * Unit tests for the MoscowBadge component using React Testing Library.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

import { MoSCoWPriority } from '../../../types';
import { MoscowBadge } from './MoscowBadge';
import styles from './MoscowBadge.module.css';

// Mock i18next instance for testing
const testI18n = i18n.createInstance({
  lng: 'en',
  resources: {
    en: {
      backlog: {
        moscow: {
          mustHave: 'Must Have',
          mustShort: 'Must',
          shouldHave: 'Should Have',
          shouldShort: 'Should',
          couldHave: 'Could Have',
          couldShort: 'Could',
          wontHave: "Won't Have",
          wontShort: "Won't",
        },
      },
    },
  },
});

// Initialize i18n before tests
beforeAll(async () => {
  await testI18n.init();
});

describe('MoscowBadge', () => {
  it('should render Must Have badge', () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={MoSCoWPriority.MUST_HAVE} />
      </I18nextProvider>
    );

    expect(screen.getByText('Must Have')).toBeInTheDocument();
  });

  it('should render Should Have badge', () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={MoSCoWPriority.SHOULD_HAVE} />
      </I18nextProvider>
    );

    expect(screen.getByText('Should Have')).toBeInTheDocument();
  });

  it('should render Could Have badge', () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={MoSCoWPriority.COULD_HAVE} />
      </I18nextProvider>
    );

    expect(screen.getByText('Could Have')).toBeInTheDocument();
  });

  it("should render Won't Have badge", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={MoSCoWPriority.WONT_HAVE} />
      </I18nextProvider>
    );

    expect(screen.getByText("Won't Have")).toBeInTheDocument();
  });

  it('should render compact badge with short label', () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={MoSCoWPriority.MUST_HAVE} compact />
      </I18nextProvider>
    );

    expect(screen.getByText('Must')).toBeInTheDocument();
  });

  it('should apply compact class when compact prop is true', () => {
    const { container } = render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={MoSCoWPriority.MUST_HAVE} compact />
      </I18nextProvider>
    );

    const badge = container.querySelector(`.${styles.compact}`);
    expect(badge).toBeInTheDocument();
  });

  it('should apply CSS custom properties for colors', () => {
    const { container } = render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={MoSCoWPriority.MUST_HAVE} />
      </I18nextProvider>
    );

    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('style');
    const style = badge?.getAttribute('style') || '';
    expect(style).toContain('--badge-color');
    expect(style).toContain('--badge-bg');
  });

  it('should default to Could Have when priority is undefined', () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <MoscowBadge priority={undefined as any} />
      </I18nextProvider>
    );

    expect(screen.getByText('Could Have')).toBeInTheDocument();
  });
});

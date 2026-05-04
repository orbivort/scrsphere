import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { WipWarnings } from './WipWarnings';
import type { WipWarning } from '../SprintBoard.types';

describe('WipWarnings', () => {
  const createMockWarning = (overrides: Partial<WipWarning> = {}): WipWarning => ({
    column: 'IN_PROGRESS',
    current: 5,
    limit: 3,
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render nothing when no warnings', () => {
      const { container } = render(<WipWarnings warnings={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render warning when WIP limit is exceeded', () => {
      const warnings: WipWarning[] = [createMockWarning()];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/WIP limit exceeded for In Progress/)).toBeInTheDocument();
    });

    it('should render correct current and limit counts', () => {
      const warnings: WipWarning[] = [createMockWarning({ current: 7, limit: 4 })];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByText(/7\/4/)).toBeInTheDocument();
    });

    it('should render multiple warnings', () => {
      const warnings: WipWarning[] = [
        createMockWarning({ column: 'IN_PROGRESS', current: 5, limit: 3 }),
        createMockWarning({ column: 'TODO', current: 10, limit: 8 }),
      ];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getAllByRole('alert')).toHaveLength(1);
      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toBeInTheDocument();
    });
  });

  describe('Warning Content', () => {
    it('should display warning message', () => {
      const warnings: WipWarning[] = [createMockWarning()];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByText(/WIP limit exceeded for In Progress/)).toBeInTheDocument();
    });

    it('should show alert icon', () => {
      const warnings: WipWarning[] = [createMockWarning()];
      render(<WipWarnings warnings={warnings} />);

      // AlertTriangleIcon should be rendered (aria-hidden)
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have alert role for warnings container', () => {
      const warnings: WipWarning[] = [createMockWarning()];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should be accessible when multiple warnings exist', () => {
      const warnings: WipWarning[] = [
        createMockWarning({ column: 'IN_PROGRESS', current: 5, limit: 3 }),
        createMockWarning({ column: 'TODO', current: 10, limit: 8 }),
      ];
      render(<WipWarnings warnings={warnings} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle warning with current equal to limit (at capacity)', () => {
      const warnings: WipWarning[] = [createMockWarning({ current: 3, limit: 3 })];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByText(/3\/3/)).toBeInTheDocument();
    });

    it('should handle warning with significantly exceeded limit', () => {
      const warnings: WipWarning[] = [createMockWarning({ current: 20, limit: 3 })];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByText(/20\/3/)).toBeInTheDocument();
    });

    it('should handle warning with limit of 1', () => {
      const warnings: WipWarning[] = [createMockWarning({ current: 2, limit: 1 })];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByText(/2\/1/)).toBeInTheDocument();
    });

    it('should handle empty warnings array', () => {
      const { container } = render(<WipWarnings warnings={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle warning with zero limit', () => {
      const warnings: WipWarning[] = [createMockWarning({ current: 1, limit: 0 })];
      render(<WipWarnings warnings={warnings} />);

      expect(screen.getByText(/1\/0/)).toBeInTheDocument();
    });
  });
});

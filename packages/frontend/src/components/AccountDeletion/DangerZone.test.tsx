import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { screen, fireEvent, renderWithProviders, initTestI18n, i18nT } from '../../test-utils';
import userEvent from '@testing-library/user-event';

import { DangerZone } from './DangerZone';

vi.mock('./DangerZone.module.css', () => ({
  default: {
    'danger-zone': 'danger-zone',
    'danger-zone-expanded': 'danger-zone-expanded',
    'danger-zone-header': 'danger-zone-header',
    'danger-zone-header-content': 'danger-zone-header-content',
    'danger-zone-icon-wrapper': 'danger-zone-icon-wrapper',
    'danger-zone-title-group': 'danger-zone-title-group',
    'danger-zone-title': 'danger-zone-title',
    'danger-zone-subtitle': 'danger-zone-subtitle',
    'danger-zone-toggle': 'danger-zone-toggle',
    'danger-zone-collapsed-indicator': 'danger-zone-collapsed-indicator',
    'danger-zone-content': 'danger-zone-content',
    'danger-zone-item': 'danger-zone-item',
    'danger-zone-item-content': 'danger-zone-item-content',
    'danger-zone-item-icon': 'danger-zone-item-icon',
    'danger-zone-item-text': 'danger-zone-item-text',
    'danger-zone-item-title': 'danger-zone-item-title',
    'danger-zone-item-description': 'danger-zone-item-description',
    'danger-zone-item-action': 'danger-zone-item-action',
  },
}));

beforeAll(async () => {
  await initTestI18n();
});

describe('DangerZone Component', () => {
  const mockOnDeleteClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render collapsed by default', () => {
      const { container } = renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(container.firstChild).not.toHaveClass('danger-zone-expanded');
    });

    it('should render the header with expand label when collapsed', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(
        screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') })
      ).toBeInTheDocument();
    });

    it('should not render the danger zone title when collapsed', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(screen.queryByText(i18nT('deleteAccount.dangerZone.title'))).not.toBeInTheDocument();
    });

    it('should not render the danger zone subtitle when collapsed', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(
        screen.queryByText(i18nT('deleteAccount.dangerZone.subtitle'))
      ).not.toBeInTheDocument();
    });

    it('should render the danger zone title when expanded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      await user.click(header);

      expect(screen.getByText(i18nT('deleteAccount.dangerZone.title'))).toBeInTheDocument();
    });

    it('should render the danger zone subtitle when expanded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      await user.click(header);

      expect(screen.getByText(i18nT('deleteAccount.dangerZone.subtitle'))).toBeInTheDocument();
    });

    it('should render the delete account button', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(
        screen.getByText(i18nT('deleteAccount.dangerZone.deleteAccount.title'))
      ).toBeInTheDocument();
    });
  });

  describe('Expansion Behavior Tests', () => {
    it('should expand when header is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      await user.click(header);

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });

    it('should collapse when header is clicked again', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });

      // First click - expand
      await user.click(header);
      expect(container.firstChild).toHaveClass('danger-zone-expanded');

      // Second click - collapse
      await user.click(header);
      expect(container.firstChild).not.toHaveClass('danger-zone-expanded');
    });

    it('should expand when Enter key is pressed on header', () => {
      const { container } = renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      fireEvent.keyDown(header, { key: 'Enter' });

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });

    it('should expand when Space key is pressed on header', () => {
      const { container } = renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      fireEvent.keyDown(header, { key: ' ' });

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });
  });

  describe('Delete Button Tests', () => {
    it('should call onDeleteClick when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', {
        name: i18nT('deleteAccount.dangerZone.deleteAccount.ariaLabel'),
      });
      await user.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('should call onDeleteClick when Enter key is pressed on delete button', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', {
        name: i18nT('deleteAccount.dangerZone.deleteAccount.ariaLabel'),
      });
      fireEvent.keyDown(deleteButton, { key: 'Enter' });

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('should call onDeleteClick when Space key is pressed on delete button', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', {
        name: i18nT('deleteAccount.dangerZone.deleteAccount.ariaLabel'),
      });
      fireEvent.keyDown(deleteButton, { key: ' ' });

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Tests', () => {
    it('should have aria-expanded attribute on header', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded to true when expanded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      await user.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls attribute pointing to content', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      expect(header).toHaveAttribute('aria-controls', 'danger-zone-content');
    });

    it('should have content with id matching aria-controls', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const content = document.getElementById('danger-zone-content');
      expect(content).toBeInTheDocument();
    });

    it('should have content with role="region"', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const content = screen.getByRole('region');
      expect(content).toHaveAttribute('id', 'danger-zone-content');
    });

    it('should have aria-labelledby on content pointing to header', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const content = screen.getByRole('region');
      expect(content).toHaveAttribute('aria-labelledby', 'danger-zone-header');
    });

    it('should have header with id for aria-labelledby reference', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      expect(header).toHaveAttribute('id', 'danger-zone-header');
    });

    it('should have accessible label on delete button', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', {
        name: i18nT('deleteAccount.dangerZone.deleteAccount.ariaLabel'),
      });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });

      await user.click(header);
      await user.click(header);
      await user.click(header);

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });

    it('should handle multiple delete button clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', {
        name: i18nT('deleteAccount.dangerZone.deleteAccount.ariaLabel'),
      });

      await user.click(deleteButton);
      await user.click(deleteButton);
      await user.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Responsive Design Tests', () => {
    it('should render correctly on desktop viewport', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      // When collapsed, title and subtitle should not be visible
      expect(screen.queryByText(i18nT('deleteAccount.dangerZone.title'))).not.toBeInTheDocument();
      expect(
        screen.queryByText(i18nT('deleteAccount.dangerZone.subtitle'))
      ).not.toBeInTheDocument();

      // After expanding, title and subtitle should be visible
      const header = screen.getByRole('button', { name: i18nT('deleteAccount.dangerZone.expand') });
      await user.click(header);

      expect(screen.getByText(i18nT('deleteAccount.dangerZone.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('deleteAccount.dangerZone.subtitle'))).toBeInTheDocument();
    });

    it('should render delete button with icon and text', () => {
      renderWithProviders(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', {
        name: i18nT('deleteAccount.dangerZone.deleteAccount.ariaLabel'),
      });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent(i18nT('deleteAccount.dangerZone.delete'));
    });
  });
});

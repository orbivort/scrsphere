import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('DangerZone Component', () => {
  const mockOnDeleteClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render collapsed by default', () => {
      const { container } = render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(container.firstChild).not.toHaveClass('danger-zone-expanded');
    });

    it('should render the header with expand label when collapsed', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(screen.getByRole('button', { name: /expand danger zone/i })).toBeInTheDocument();
    });

    it('should not render the danger zone title when collapsed', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
    });

    it('should not render the danger zone subtitle when collapsed', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(screen.queryByText('Irreversible and destructive')).not.toBeInTheDocument();
    });

    it('should render the danger zone title when expanded', async () => {
      const user = userEvent.setup();
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      await user.click(header);

      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('should render the danger zone subtitle when expanded', async () => {
      const user = userEvent.setup();
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      await user.click(header);

      expect(screen.getByText('Irreversible and destructive')).toBeInTheDocument();
    });

    it('should render the delete account button', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });
  });

  describe('Expansion Behavior Tests', () => {
    it('should expand when header is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      await user.click(header);

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });

    it('should collapse when header is clicked again', async () => {
      const user = userEvent.setup();
      const { container } = render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });

      // First click - expand
      await user.click(header);
      expect(container.firstChild).toHaveClass('danger-zone-expanded');

      // Second click - collapse
      await user.click(header);
      expect(container.firstChild).not.toHaveClass('danger-zone-expanded');
    });

    it('should expand when Enter key is pressed on header', () => {
      const { container } = render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      fireEvent.keyDown(header, { key: 'Enter' });

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });

    it('should expand when Space key is pressed on header', () => {
      const { container } = render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      fireEvent.keyDown(header, { key: ' ' });

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });
  });

  describe('Delete Button Tests', () => {
    it('should call onDeleteClick when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete your account permanently' });
      await user.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('should call onDeleteClick when Enter key is pressed on delete button', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete your account permanently' });
      fireEvent.keyDown(deleteButton, { key: 'Enter' });

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('should call onDeleteClick when Space key is pressed on delete button', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete your account permanently' });
      fireEvent.keyDown(deleteButton, { key: ' ' });

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Tests', () => {
    it('should have aria-expanded attribute on header', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded to true when expanded', async () => {
      const user = userEvent.setup();
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      await user.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls attribute pointing to content', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      expect(header).toHaveAttribute('aria-controls', 'danger-zone-content');
    });

    it('should have content with id matching aria-controls', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const content = document.getElementById('danger-zone-content');
      expect(content).toBeInTheDocument();
    });

    it('should have content with role="region"', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const content = screen.getByRole('region');
      expect(content).toHaveAttribute('id', 'danger-zone-content');
    });

    it('should have aria-labelledby on content pointing to header', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const content = screen.getByRole('region');
      expect(content).toHaveAttribute('aria-labelledby', 'danger-zone-header');
    });

    it('should have header with id for aria-labelledby reference', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });
      expect(header).toHaveAttribute('id', 'danger-zone-header');
    });

    it('should have accessible label on delete button', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete your account permanently' });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup();
      const { container } = render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const header = screen.getByRole('button', { name: /expand danger zone/i });

      await user.click(header);
      await user.click(header);
      await user.click(header);

      expect(container.firstChild).toHaveClass('danger-zone-expanded');
    });

    it('should handle multiple delete button clicks', async () => {
      const user = userEvent.setup();
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete your account permanently' });

      await user.click(deleteButton);
      await user.click(deleteButton);
      await user.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Responsive Design Tests', () => {
    it('should render correctly on desktop viewport', async () => {
      const user = userEvent.setup();
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      // When collapsed, title and subtitle should not be visible
      expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
      expect(screen.queryByText('Irreversible and destructive')).not.toBeInTheDocument();

      // After expanding, title and subtitle should be visible
      const header = screen.getByRole('button', { name: /expand danger zone/i });
      await user.click(header);

      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      expect(screen.getByText('Irreversible and destructive')).toBeInTheDocument();
    });

    it('should render delete button with icon and text', () => {
      render(<DangerZone onDeleteClick={mockOnDeleteClick} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete your account permanently' });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent('Delete');
    });
  });
});

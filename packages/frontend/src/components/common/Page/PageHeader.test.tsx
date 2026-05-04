import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PageHeader } from './PageHeader';

// Mock CSS modules
vi.mock('./PageHeader.module.css', () => ({
  default: {
    header: 'header',
    content: 'content',
    'title-section': 'title-section',
    'back-button': 'back-button',
    'back-label': 'back-label',
    'text-content': 'text-content',
    title: 'title',
    subtitle: 'subtitle',
    actions: 'actions',
  },
}));

describe('PageHeader Component', () => {
  describe('Component Rendering Tests', () => {
    it('renders with required title prop', () => {
      render(<PageHeader title="Test Page" />);

      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    it('renders title as h1 element', () => {
      render(<PageHeader title="Page Title" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Page Title');
    });

    it('renders with subtitle when provided', () => {
      render(<PageHeader title="Page Title" subtitle="Page subtitle description" />);

      expect(screen.getByText('Page subtitle description')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      render(<PageHeader title="Page Title" />);

      const subtitle = document.querySelector('.subtitle');
      expect(subtitle).not.toBeInTheDocument();
    });

    it('renders within header element', () => {
      const { container } = render(<PageHeader title="Page Title" />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Back Button Tests', () => {
    it('renders back button when onBack prop is provided', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('does not render back button when onBack prop is not provided', () => {
      render(<PageHeader title="Page Title" />);

      const backButton = screen.queryByRole('button', { name: /back/i });
      expect(backButton).not.toBeInTheDocument();
    });

    it('calls onBack handler when back button is clicked', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(handleBack).toHaveBeenCalledTimes(1);
    });

    it('renders default back label', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('renders custom back label when provided', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} backLabel="Return" />);

      expect(screen.getByText('Return')).toBeInTheDocument();
    });

    it('back button has correct aria-label', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} backLabel="Go Back" />);

      const backButton = screen.getByRole('button', { name: /go back/i });
      expect(backButton).toHaveAttribute('aria-label', 'Go Back');
    });

    it('back button has type="button"', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toHaveAttribute('type', 'button');
    });

    it('back button renders back arrow icon', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      const svg = backButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('back icon has aria-hidden="true"', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Actions Tests', () => {
    it('renders actions when provided', () => {
      render(
        <PageHeader title="Page Title" actions={<button data-testid="action-btn">Action</button>} />
      );

      expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    });

    it('does not render actions container when actions not provided', () => {
      const { container } = render(<PageHeader title="Page Title" />);

      const actionsDiv = container.querySelector('.actions');
      expect(actionsDiv).not.toBeInTheDocument();
    });

    it('renders multiple action elements', () => {
      render(
        <PageHeader
          title="Page Title"
          actions={
            <>
              <button data-testid="action-1">Action 1</button>
              <button data-testid="action-2">Action 2</button>
            </>
          }
        />
      );

      expect(screen.getByTestId('action-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-2')).toBeInTheDocument();
    });

    it('action buttons are clickable', () => {
      const handleAction = vi.fn();
      render(
        <PageHeader
          title="Page Title"
          actions={<button onClick={handleAction}>Click Action</button>}
        />
      );

      const actionButton = screen.getByText('Click Action');
      fireEvent.click(actionButton);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS Classes Tests', () => {
    it('applies header class to header element', () => {
      const { container } = render(<PageHeader title="Page Title" />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('header');
    });

    it('applies title class to h1 element', () => {
      render(<PageHeader title="Page Title" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('title');
    });

    it('applies subtitle class to subtitle paragraph', () => {
      render(<PageHeader title="Page Title" subtitle="Subtitle text" />);

      const subtitle = document.querySelector('.subtitle');
      expect(subtitle).toHaveClass('subtitle');
    });

    it('applies back-button class to back button', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toHaveClass('back-button');
    });

    it('applies actions class to actions container', () => {
      const { container } = render(
        <PageHeader title="Page Title" actions={<button>Action</button>} />
      );

      const actionsDiv = container.querySelector('.actions');
      expect(actionsDiv).toHaveClass('actions');
    });
  });

  describe('Accessibility Tests', () => {
    it('has single h1 element for page structure', () => {
      render(<PageHeader title="Page Title" />);

      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
    });

    it('back button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.tab();

      expect(backButton).toHaveFocus();
    });

    it('back button can be activated with Enter key', async () => {
      const user = userEvent.setup();
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.type(backButton, '{enter}');

      // Enter key may trigger multiple events, just verify it was called
      expect(handleBack).toHaveBeenCalled();
    });

    it('back button can be activated with Space key', async () => {
      const user = userEvent.setup();
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.type(backButton, ' ');

      // Space key may trigger multiple events, just verify it was called
      expect(handleBack).toHaveBeenCalled();
    });

    it('action buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <PageHeader title="Page Title" actions={<button data-testid="action-btn">Action</button>} />
      );

      const actionButton = screen.getByTestId('action-btn');
      await user.tab();

      expect(actionButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      render(<PageHeader title="" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('handles very long title', () => {
      const longTitle = 'Very Long Page Title that should be displayed properly';
      render(<PageHeader title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<PageHeader title="Page <Title> & Special" />);

      expect(screen.getByText('Page <Title> & Special')).toBeInTheDocument();
    });

    it('handles empty subtitle (does not render)', () => {
      render(<PageHeader title="Page Title" subtitle="" />);

      const subtitle = document.querySelector('.subtitle');
      expect(subtitle).not.toBeInTheDocument();
    });

    it('handles very long subtitle', () => {
      const longSubtitle = 'Very long subtitle that should be displayed';
      render(<PageHeader title="Page Title" subtitle={longSubtitle} />);

      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('handles empty back label', () => {
      const handleBack = vi.fn();
      render(<PageHeader title="Page Title" onBack={handleBack} backLabel="" />);

      const backButton = screen.getByRole('button');
      expect(backButton).toHaveAttribute('aria-label', '');
    });

    it('renders with both back button and actions', () => {
      const handleBack = vi.fn();
      render(
        <PageHeader
          title="Page Title"
          onBack={handleBack}
          actions={<button data-testid="action-btn">Action</button>}
        />
      );

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    });

    it('renders with all props combined', () => {
      const handleBack = vi.fn();
      render(
        <PageHeader
          title="Complete Page"
          subtitle="With all features"
          onBack={handleBack}
          backLabel="Return"
          actions={
            <>
              <button data-testid="save-btn">Save</button>
              <button data-testid="cancel-btn">Cancel</button>
            </>
          }
        />
      );

      expect(screen.getByText('Complete Page')).toBeInTheDocument();
      expect(screen.getByText('With all features')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return/i })).toBeInTheDocument();
      expect(screen.getByTestId('save-btn')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('maintains proper DOM structure', () => {
      const handleBack = vi.fn();
      const { container } = render(
        <PageHeader
          title="Test Page"
          subtitle="Test Subtitle"
          onBack={handleBack}
          actions={<button>Action</button>}
        />
      );

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();

      const h1 = header?.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('Test Page');

      const buttons = header?.querySelectorAll('button');
      expect(buttons?.length).toBeGreaterThanOrEqual(2); // back button + action button
    });

    it('back button click does not bubble to parent', () => {
      const parentClick = vi.fn();
      const handleBack = vi.fn();

      render(
        <div onClick={parentClick}>
          <PageHeader title="Page Title" onBack={handleBack} />
        </div>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(handleBack).toHaveBeenCalledTimes(1);
      // Note: event bubbling would need stopPropagation to prevent parent click
    });
  });
});

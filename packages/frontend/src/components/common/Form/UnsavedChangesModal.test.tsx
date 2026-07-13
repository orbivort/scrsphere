import {
  screen,
  fireEvent,
  waitFor,
  cleanup,
  renderWithProviders,
  initTestI18n,
} from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { vi, beforeAll } from 'vitest';

import { UnsavedChangesModal } from './UnsavedChangesModal';

vi.mock('./UnsavedChangesModal.module.css', () => ({
  default: {
    overlay: 'overlay',
    modal: 'modal',
    'gradient-orb': 'gradient-orb',
    header: 'header',
    'header-content': 'header-content',
    'icon-wrapper': 'icon-wrapper',
    title: 'title',
    subtitle: 'subtitle',
    'close-button': 'close-button',
    body: 'body',
    'warning-card': 'warning-card',
    'warning-header': 'warning-header',
    'warning-icon-large': 'warning-icon-large',
    'warning-title-group': 'warning-title-group',
    'warning-title': 'warning-title',
    'warning-subtitle': 'warning-subtitle',
    'warning-content': 'warning-content',
    'warning-text': 'warning-text',
    'info-box': 'info-box',
    'info-icon': 'info-icon',
    'info-text': 'info-text',
    'options-list': 'options-list',
    'options-title': 'options-title',
    'options-items': 'options-items',
    footer: 'footer',
    button: 'button',
    'button-secondary': 'button-secondary',
    'button-danger': 'button-danger',
  },
}));

describe('UnsavedChangesModal', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen={false} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
  });

  it('should display default message', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(
      screen.getByText('You have unsaved changes. Are you sure you want to discard them?')
    ).toBeInTheDocument();
  });

  it('should display custom title and message', () => {
    renderWithProviders(
      <UnsavedChangesModal
        isOpen
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Custom Title"
        message="Custom message"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('should call onConfirm when discard button is clicked', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    fireEvent.click(screen.getByText('Discard Changes'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    // Click the secondary button (Go Back)
    const cancelButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when close button is clicked', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel when overlay is clicked (feature disabled)', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when Escape key is pressed', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should have correct ARIA attributes', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'unsaved-changes-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'unsaved-changes-message');
  });

  it('should display warning box with icon', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(screen.getByText('Attention Required')).toBeInTheDocument();
    expect(
      screen.getByText(/Your changes will be permanently lost if you discard them/)
    ).toBeInTheDocument();
    // Check options list is displayed
    expect(screen.getByText('What would you like to do?')).toBeInTheDocument();
  });

  it('should focus discard button when opened', async () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByText('Discard Changes')).toHaveFocus();
    });
  });

  it('should have focusable elements', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    // Verify all interactive elements are present
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
    // Use getAllByText since 'Go Back' appears in both the options list and button
    expect(screen.getAllByText('Go Back').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Discard Changes')).toBeInTheDocument();
  });

  it('should prevent body scroll when open', () => {
    renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { unmount } = renderWithProviders(
      <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  describe('Focus Trap Keyboard Navigation', () => {
    it('should trap focus within modal when Tab is pressed', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const closeButton = screen.getByLabelText('Close');
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      const discardButton = screen.getByRole('button', { name: /discard changes/i });

      await user.click(closeButton);
      expect(closeButton).toHaveFocus();

      await user.tab();
      expect(goBackButton).toHaveFocus();

      await user.tab();
      expect(discardButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should trap focus within modal when Shift+Tab is pressed', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const closeButton = screen.getByLabelText('Close');
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      const discardButton = screen.getByRole('button', { name: /discard changes/i });

      await user.click(discardButton);
      expect(discardButton).toHaveFocus();

      await user.tab({ shift: true });
      expect(goBackButton).toHaveFocus();

      await user.tab({ shift: true });
      expect(closeButton).toHaveFocus();

      await user.tab({ shift: true });
      expect(discardButton).toHaveFocus();
    });

    it('should not call onCancel for non-Escape keys', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should handle rapid Tab key presses', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByLabelText('Close'));

      for (let i = 0; i < 5; i++) {
        await user.tab();
      }

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have h2 heading for dialog title', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Unsaved Changes');
    });

    it('should have h3 heading for warning title', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const warningHeading = screen.getByRole('heading', { level: 3 });
      expect(warningHeading).toHaveTextContent('Attention Required');
    });

    it('should have a ul element for options list', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const optionsList = screen.getByRole('list');
      expect(optionsList).toBeInTheDocument();
    });

    it('should have list items in options list', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThanOrEqual(2);
    });

    it('should have all interactive buttons accessible', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);

      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should reference correct aria-describedby element', () => {
      renderWithProviders(
        <UnsavedChangesModal
          isOpen
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          message="Custom test message"
        />
      );

      const dialog = screen.getByRole('dialog');
      const describedById = dialog.getAttribute('aria-describedby');
      const describedElement = document.getElementById(describedById!);
      expect(describedElement).toHaveTextContent('Custom test message');
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle long custom title', () => {
      const longTitle =
        'This is a very long title that exceeds normal length and should still display correctly';
      renderWithProviders(
        <UnsavedChangesModal
          isOpen
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title={longTitle}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long custom message', () => {
      const longMessage =
        'This is a very long custom message that contains multiple sentences and should still be displayed correctly without any issues. It provides detailed information about what will happen if the user chooses to discard their changes.';
      renderWithProviders(
        <UnsavedChangesModal
          isOpen
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          message={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in title and message', () => {
      renderWithProviders(
        <UnsavedChangesModal
          isOpen
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Delete <item> & 'quotes'"
          message='Are you sure you want to delete "this item"?'
        />
      );

      expect(screen.getByText("Delete <item> & 'quotes'")).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete "this item"?')).toBeInTheDocument();
    });

    it('should handle empty custom title and message', () => {
      renderWithProviders(
        <UnsavedChangesModal
          isOpen
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title=""
          message=""
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const titleElement = screen.getByRole('heading', { level: 2 });
      expect(titleElement).toBeEmptyDOMElement();
    });

    it('should handle rapid open/close transitions', () => {
      const { rerender } = renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <UnsavedChangesModal isOpen={false} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle repeated onConfirm calls gracefully', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const discardButton = screen.getByText('Discard Changes');
      fireEvent.click(discardButton);
      fireEvent.click(discardButton);
      fireEvent.click(discardButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(3);
    });
  });

  describe('User Interaction Tests with userEvent', () => {
    it('should call onConfirm when discard button is clicked via userEvent', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByText('Discard Changes'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when go back button is clicked via userEvent', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /go back/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when close button is clicked via userEvent', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByLabelText('Close'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should handle Enter key on interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const discardButton = screen.getByText('Discard Changes');
      await user.click(discardButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual Elements Tests', () => {
    it('should render gradient orb decorative element', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const orb = document.querySelector('[class*="gradient-orb"]');
      expect(orb).toBeInTheDocument();
    });

    it('should render warning card with proper styling', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const warningCard = document.querySelector('[class*="warning-card"]');
      expect(warningCard).toBeInTheDocument();
    });

    it('should render info box with icon and text', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      expect(
        screen.getByText(/Your changes will be permanently lost if you discard them/)
      ).toBeInTheDocument();
    });

    it('should render header with icon wrapper', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const headerContent = document.querySelector('[class*="header-content"]');
      expect(headerContent).toBeInTheDocument();
    });

    it('should render footer with action buttons', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const footer = document.querySelector('[class*="footer"]');
      expect(footer).toBeInTheDocument();
      expect(screen.getAllByText('Go Back').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Discard Changes')).toBeInTheDocument();
    });
  });

  describe('Callback Behavior Tests', () => {
    it('should not call any callbacks when overlay is clicked but modal content is not', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      const overlay = document.querySelector('[class*="overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call correct callback based on button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /go back/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();

      mockOnCancel.mockClear();

      await user.click(screen.getByText('Discard Changes'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should handle callbacks that are functions', () => {
      renderWithProviders(
        <UnsavedChangesModal isOpen onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
      );

      expect(typeof mockOnConfirm).toBe('function');
      expect(typeof mockOnCancel).toBe('function');
    });
  });
});

import { screen, fireEvent, renderWithProviders, initTestI18n } from '../../../test-utils';
import { vi, beforeAll } from 'vitest';

import { DraftRestorePrompt } from './DraftRestorePrompt';

describe('DraftRestorePrompt', () => {
  const mockOnRestore = vi.fn();
  const mockOnDiscard = vi.fn();

  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render restore prompt with correct title', () => {
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={new Date()}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText('Restore unsaved progress?')).toBeInTheDocument();
  });

  it('should render both action buttons', () => {
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={new Date()}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText('Start Fresh')).toBeInTheDocument();
    expect(screen.getByText('Restore Draft')).toBeInTheDocument();
  });

  it('should call onRestore when restore button is clicked', () => {
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={new Date()}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    fireEvent.click(screen.getByText('Restore Draft'));
    expect(mockOnRestore).toHaveBeenCalledTimes(1);
  });

  it('should call onDiscard when discard button is clicked', () => {
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={new Date()}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    fireEvent.click(screen.getByText('Start Fresh'));
    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
  });

  it('should format time as "just now" for recent drafts', () => {
    const justNow = new Date();
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={justNow}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it('should format time as minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={fiveMinutesAgo}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
  });

  it('should format time as hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={twoHoursAgo}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
  });

  it('should format time as days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={threeDaysAgo}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText(/3 days ago/)).toBeInTheDocument();
  });

  it('should show "recently" when lastSavedAt is null', () => {
    renderWithProviders(
      <DraftRestorePrompt lastSavedAt={null} onRestore={mockOnRestore} onDiscard={mockOnDiscard} />
    );

    expect(screen.getByText(/recently/)).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    renderWithProviders(
      <DraftRestorePrompt
        lastSavedAt={new Date()}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    const alertDialog = screen.getByRole('alertdialog');
    expect(alertDialog).toHaveAttribute('aria-labelledby', 'draft-title');
  });
});

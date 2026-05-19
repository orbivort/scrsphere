import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SendMessageModal } from './SendMessageModal';
import { notificationApi } from '../../services/notificationApi';
import { MAX_MESSAGE_LENGTH } from '../../utils/constants';

// Mock notificationApi
vi.mock('../../services/notificationApi', () => ({
  notificationApi: {
    sendDirectMessage: vi.fn(),
  },
}));

// Mock useModalFocus
vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: vi.fn(() => ({ modalRef: { current: null } })),
}));

// Mock UnsavedChangesModal
vi.mock('../../components/common/Form/UnsavedChangesModal', () => ({
  UnsavedChangesModal: vi.fn(() => null),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  recipientId: 'user-1',
  recipientName: 'John Doe',
  recipientEmail: 'john@example.com',
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui) => {
  const testQueryClient = createTestQueryClient();
  return render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>);
};

const setup = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return {
    render: () => renderWithProviders(<SendMessageModal {...props} />),
    props,
  };
};

describe('SendMessageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render modal when isOpen is true', () => {
      const { render } = setup();
      render();

      expect(screen.getByRole('heading', { name: 'Send Message' })).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes('To: John Doe (john@example.com)'))
      ).toBeInTheDocument();
    });

    test('should not render when isOpen is false', () => {
      const { render } = setup({ isOpen: false });
      render();

      expect(screen.queryByRole('heading', { name: 'Send Message' })).not.toBeInTheDocument();
    });

    test('should render textarea for message input', () => {
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      expect(textarea).toBeInTheDocument();
    });

    test('should display character counter', () => {
      const { render } = setup();
      render();

      const counter = screen.getByText('0/5000');
      expect(counter).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('should update message when textarea changes', () => {
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello, John!' } });

      expect(textarea).toHaveValue('Hello, John!');
    });

    test('should display validation error when message is empty', () => {
      const { render } = setup();
      const { container } = render();

      const form = container.querySelector('#send-message-form');
      expect(form).toBeInTheDocument();

      // Trigger form submission directly to bypass native validation
      fireEvent.submit(form!);

      expect(screen.getByText('Please enter a message.')).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    test('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    test('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Message Validation', () => {
    test('should show error when message exceeds max length', () => {
      const { render } = setup();
      const { container } = render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'a'.repeat(MAX_MESSAGE_LENGTH + 1) } });

      const form = container.querySelector('#send-message-form');
      fireEvent.submit(form!);

      expect(
        screen.getByText(`Message must be less than ${MAX_MESSAGE_LENGTH} characters.`)
      ).toBeInTheDocument();
    });
  });

  describe('Mutation Error Handling', () => {
    let rejectionHandler: (err: Error) => void;

    beforeEach(() => {
      vi.mocked(notificationApi.sendDirectMessage).mockReset();
      rejectionHandler = vi.fn();
      process.on('unhandledRejection', rejectionHandler);
    });

    afterEach(() => {
      process.removeListener('unhandledRejection', rejectionHandler);
    });

    test('should show 404 error when recipient is not found', async () => {
      vi.mocked(notificationApi.sendDirectMessage).mockRejectedValue(new Error('404 Not found'));
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const form = document.querySelector('#send-message-form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(
          screen.getByText('Recipient not found. The user may have been removed.')
        ).toBeInTheDocument();
      });
    });

    test('should show 403 error when user lacks permission', async () => {
      vi.mocked(notificationApi.sendDirectMessage).mockRejectedValue(new Error('403 Forbidden'));
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const form = document.querySelector('#send-message-form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(
          screen.getByText('You do not have permission to send messages to this user.')
        ).toBeInTheDocument();
      });
    });

    test('should show network error on connection failure', async () => {
      vi.mocked(notificationApi.sendDirectMessage).mockRejectedValue(
        new Error('Network connection lost')
      );
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const form = document.querySelector('#send-message-form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(
          screen.getByText('Network error. Please check your connection and try again.')
        ).toBeInTheDocument();
      });
    });

    test('should show generic error for unknown errors', async () => {
      vi.mocked(notificationApi.sendDirectMessage).mockRejectedValue(
        new Error('Internal server error')
      );
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const form = document.querySelector('#send-message-form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to send message. Please try again later.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    test('should show success message after sending', async () => {
      vi.mocked(notificationApi.sendDirectMessage).mockResolvedValue(undefined);
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello, John!' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Message sent successfully!')).toBeInTheDocument();
      });
    });

    test('should disable form fields after successful send', async () => {
      vi.mocked(notificationApi.sendDirectMessage).mockResolvedValue(undefined);
      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello, John!' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Message sent successfully!')).toBeInTheDocument();
      });

      expect(textarea).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeDisabled();
    });

    test('should not close modal when close is clicked and mutation is pending', async () => {
      let resolvePromise: (value: unknown) => void;
      const deferredPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(notificationApi.sendDirectMessage).mockReturnValue(deferredPromise);

      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });

      // Try to close while pending
      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onClose).not.toHaveBeenCalled();

      // Resolve the promise to avoid test leaks
      resolvePromise!(undefined);
    });

    test('should show loading indicator while sending', async () => {
      let resolvePromise: (value: unknown) => void;
      const deferredPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(notificationApi.sendDirectMessage).mockReturnValue(deferredPromise);

      const { render } = setup();
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });

      resolvePromise!(undefined);
    });

    test('should auto-close after successful send', async () => {
      vi.useFakeTimers();
      vi.mocked(notificationApi.sendDirectMessage).mockResolvedValue(undefined);

      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const textarea = screen.getByPlaceholderText('Type your message here...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      // Flush pending promises to process mutation result
      await vi.advanceTimersByTimeAsync(0);

      // Success message should appear after promise resolves
      expect(screen.getByText('Message sent successfully!')).toBeInTheDocument();

      // Advance past the 2000ms auto-close timeout
      await vi.advanceTimersByTimeAsync(2000);

      expect(onClose).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});

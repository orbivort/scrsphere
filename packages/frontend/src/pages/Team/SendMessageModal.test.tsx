import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SendMessageModal } from './SendMessageModal';

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
});

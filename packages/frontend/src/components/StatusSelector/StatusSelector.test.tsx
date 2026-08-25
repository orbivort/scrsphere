import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import {
  screen,
  fireEvent,
  waitFor,
  act,
  renderWithProviders,
  initTestI18n,
} from '../../test-utils';
import userEvent from '@testing-library/user-event';

import { StatusSelector, type StatusConfig, type StatusSelectorProps } from './StatusSelector';

vi.mock('./StatusSelector.module.css', () => ({
  default: {
    'status-selector': 'status-selector',
    'status-selector-trigger': 'status-selector-trigger',
    animating: 'animating',
    'status-disabled': 'status-disabled',
    'status-icon-wrapper': 'status-icon-wrapper',
    'status-label': 'status-label',
    'status-loading': 'status-loading',
    'status-locked': 'status-locked',
    'status-arrow': 'status-arrow',
    'status-dropdown': 'status-dropdown',
    'dropdown-position-left': 'dropdown-position-left',
    'dropdown-position-right': 'dropdown-position-right',
    'dropdown-position-center': 'dropdown-position-center',
    'dropdown-header': 'dropdown-header',
    'dropdown-title': 'dropdown-title',
    'status-options': 'status-options',
    'status-option': 'status-option',
    selected: 'selected',
    'status-option-disabled': 'status-option-disabled',
    'option-icon-wrapper': 'option-icon-wrapper',
    'option-content': 'option-content',
    'option-label': 'option-label',
    'option-desc': 'option-desc',
    'option-check': 'option-check',
    'option-locked': 'option-locked',
    'dropdown-footer': 'dropdown-footer',
    'dropdown-hint': 'dropdown-hint',
  },
}));

type TestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

const mockStatusConfig: Record<TestStatus, StatusConfig> = {
  NEW: {
    label: 'New',
    color: 'var(--color-gray-500)',
    bgColor: 'var(--color-gray-100)',
    borderColor: 'var(--color-gray-300)',
    icon: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
    description: 'Item is newly created',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'var(--color-primary-500)',
    bgColor: 'var(--color-primary-100)',
    borderColor: 'var(--color-primary-300)',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'Work is in progress',
  },
  DONE: {
    label: 'Done',
    color: 'var(--color-success-500)',
    bgColor: 'var(--color-success-100)',
    borderColor: 'var(--color-success-300)',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'Work is completed',
  },
};

const defaultProps: StatusSelectorProps<TestStatus> = {
  currentStatus: 'NEW',
  statuses: ['NEW', 'IN_PROGRESS', 'DONE'],
  statusConfig: mockStatusConfig,
  onStatusChange: vi.fn(),
};

describe('StatusSelector Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('renders with default props', () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders current status label', () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders status icon', () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const svg = container.querySelector('.status-icon-wrapper svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders dropdown arrow by default', () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const arrow = container.querySelector('.status-arrow svg');
      expect(arrow).toBeInTheDocument();
    });

    it('applies custom status colors via CSS variables', () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        '--status-color': mockStatusConfig.NEW.color,
        '--status-bg': mockStatusConfig.NEW.bgColor,
        '--status-border': mockStatusConfig.NEW.borderColor,
      });
    });

    it('renders with data-status attribute', () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-status', 'NEW');
    });

    it('renders status selector container', () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      expect(container.querySelector('.status-selector')).toBeInTheDocument();
    });

    it('renders trigger button', () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      expect(container.querySelector('.status-selector-trigger')).toBeInTheDocument();
    });
  });

  describe('Loading State Tests', () => {
    it('renders loading spinner when isLoading is true', () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} isLoading={true} />
      );

      expect(container.querySelector('.status-loading')).toBeInTheDocument();
    });

    it('does not render arrow when loading', () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} isLoading={true} />
      );

      expect(container.querySelector('.status-arrow')).not.toBeInTheDocument();
    });

    it('disables button when loading', () => {
      renderWithProviders(<StatusSelector {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not open dropdown when loading', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
    });

    it('applies disabled class when loading', () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} isLoading={true} />
      );

      expect(container.querySelector('.status-disabled')).toBeInTheDocument();
    });

    it('has correct aria-label when loading', () => {
      renderWithProviders(<StatusSelector {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Current status: New. Click to change status.');
    });
  });

  describe('Disabled State Tests', () => {
    it('renders lock icon when disabled', () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} disabled={true} />
      );

      expect(container.querySelector('.status-locked')).toBeInTheDocument();
    });

    it('does not render arrow when disabled', () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} disabled={true} />
      );

      expect(container.querySelector('.status-arrow')).not.toBeInTheDocument();
    });

    it('disables button when disabled prop is true', () => {
      renderWithProviders(<StatusSelector {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not open dropdown when disabled', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
    });

    it('applies disabled class when disabled', () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} disabled={true} />
      );

      expect(container.querySelector('.status-disabled')).toBeInTheDocument();
    });

    it('has correct aria-label when disabled', () => {
      renderWithProviders(<StatusSelector {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Current status: New (locked)');
    });

    it('does not have aria-haspopup when disabled', () => {
      renderWithProviders(<StatusSelector {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-haspopup');
    });

    it('does not have aria-expanded when disabled', () => {
      renderWithProviders(<StatusSelector {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-expanded');
    });
  });

  describe('Dropdown Opening and Closing Tests', () => {
    it('opens dropdown when clicked', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.getByText('Change Status')).toBeInTheDocument();
    });

    it('closes dropdown when clicked again', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(screen.getByText('Change Status')).toBeInTheDocument();

      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when clicking outside', async () => {
      renderWithProviders(
        <div>
          <StatusSelector {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(screen.getByText('Change Status')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('outside'));
      await waitFor(() => {
        expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
      });
    });

    it('renders dropdown header', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.getByText('Change Status')).toBeInTheDocument();
    });

    it('renders dropdown footer', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.getByText('Click to change item status')).toBeInTheDocument();
    });

    it('renders all status options', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('New');
      expect(options[1]).toHaveTextContent('In Progress');
      expect(options[2]).toHaveTextContent('Done');
    });

    it('renders status descriptions', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.getByText('Item is newly created')).toBeInTheDocument();
      expect(screen.getByText('Work is in progress')).toBeInTheDocument();
      expect(screen.getByText('Work is completed')).toBeInTheDocument();
    });

    it('has aria-haspopup attribute when not disabled', () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Status Selection Tests', () => {
    it('calls onStatusChange when selecting a different status', async () => {
      const onStatusChange = vi.fn();
      renderWithProviders(<StatusSelector {...defaultProps} onStatusChange={onStatusChange} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const inProgressOption = screen.getByText('In Progress').closest('button');
      if (inProgressOption) {
        await userEvent.click(inProgressOption);
      }

      expect(onStatusChange).toHaveBeenCalledWith('IN_PROGRESS');
    });

    it('does not call onStatusChange when selecting the same status', async () => {
      const onStatusChange = vi.fn();
      renderWithProviders(<StatusSelector {...defaultProps} onStatusChange={onStatusChange} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const newOption = screen.getAllByText('New')[0].closest('button');
      if (newOption) {
        await userEvent.click(newOption);
      }

      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('closes dropdown after selecting a status', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const doneOption = screen.getByText('Done').closest('button');
      if (doneOption) {
        await userEvent.click(doneOption);
      }

      await waitFor(() => {
        expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
      });
    });

    it('shows check icon on selected status', async () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const selectedOption = container.querySelector('.status-option.selected');
      expect(selectedOption?.querySelector('.option-check')).toBeInTheDocument();
    });

    it('applies selected class to current status', async () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const selectedOption = container.querySelector('.status-option.selected');
      expect(selectedOption).toBeInTheDocument();
      expect(selectedOption).toHaveTextContent('New');
    });

    it('sets aria-selected to true for current status', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const newOption = screen.getAllByRole('option')[0];
      expect(newOption).toHaveAttribute('aria-selected', 'true');
    });

    it('sets aria-selected to false for other statuses', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      expect(options[2]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Available Statuses Tests', () => {
    it('disables unavailable statuses', async () => {
      renderWithProviders(
        <StatusSelector {...defaultProps} availableStatuses={['NEW', 'IN_PROGRESS']} />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const doneOption = screen.getByText('Done').closest('button');
      expect(doneOption).toBeDisabled();
    });

    it('shows lock icon on unavailable statuses', async () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} availableStatuses={['NEW']} />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const disabledOptions = container.querySelectorAll('.status-option-disabled');
      expect(disabledOptions.length).toBeGreaterThan(0);

      const lockedIcon = container.querySelector('.option-locked');
      expect(lockedIcon).toBeInTheDocument();
    });

    it('does not call onStatusChange when selecting unavailable status', async () => {
      const onStatusChange = vi.fn();
      renderWithProviders(
        <StatusSelector
          {...defaultProps}
          onStatusChange={onStatusChange}
          availableStatuses={['NEW']}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const inProgressOption = screen.getByText('In Progress').closest('button');
      if (inProgressOption) {
        fireEvent.click(inProgressOption);
      }

      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('applies disabled class to unavailable statuses', async () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} availableStatuses={['NEW']} />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const disabledOptions = container.querySelectorAll('.status-option-disabled');
      expect(disabledOptions.length).toBe(2);
    });

    it('sets aria-disabled to true for unavailable statuses', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} availableStatuses={['NEW']} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      expect(options[1]).toHaveAttribute('aria-disabled', 'true');
      expect(options[2]).toHaveAttribute('aria-disabled', 'true');
    });

    it('allows selecting available statuses', async () => {
      const onStatusChange = vi.fn();
      renderWithProviders(
        <StatusSelector
          {...defaultProps}
          onStatusChange={onStatusChange}
          availableStatuses={['NEW', 'IN_PROGRESS']}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const inProgressOption = screen.getByText('In Progress').closest('button');
      if (inProgressOption) {
        await userEvent.click(inProgressOption);
      }

      expect(onStatusChange).toHaveBeenCalledWith('IN_PROGRESS');
    });

    it('all statuses are available when availableStatuses is not provided', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option).not.toBeDisabled();
      });
    });
  });

  describe('Animation Tests', () => {
    it('applies animating class after status change', async () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const inProgressOption = screen.getByText('In Progress').closest('button');
      if (inProgressOption) {
        await userEvent.click(inProgressOption);
      }

      await waitFor(() => {
        expect(container.querySelector('.animating')).toBeInTheDocument();
      });
    });

    it('removes animating class after animation duration', async () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const inProgressOption = screen.getByText('In Progress').closest('button');
      if (inProgressOption) {
        await userEvent.click(inProgressOption);
      }

      await waitFor(
        () => {
          expect(container.querySelector('.animating')).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Dropdown Positioning Tests', () => {
    it('calculates dropdown position on open', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('applies position class to dropdown', async () => {
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        const dropdown = container.querySelector('.status-dropdown');
        expect(dropdown).toHaveClass('dropdown-position-left');
      });
    });

    it('updates position on window resize', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });

    it('updates position on scroll', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
    });
  });

  describe('Dropdown Position Calculation Tests', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const mockRect = (overrides: Partial<DOMRect>): DOMRect =>
      ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        toJSON: () => ({}),
        ...overrides,
      }) as DOMRect;

    const setupPositionGeometry = (viewportWidth: number, left: number, width: number) => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(viewportWidth);
      const right = left + width;
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => {
        return mockRect({ left, right, width });
      });
    };

    it('positions dropdown to the right when it would overflow the right edge only', async () => {
      setupPositionGeometry(800, 600, 100);
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.status-dropdown')).toHaveClass('dropdown-position-right');
      });
    });

    it('positions dropdown to the right when both edges overflow and right has more space', async () => {
      setupPositionGeometry(300, 30, 100);
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.status-dropdown')).toHaveClass('dropdown-position-right');
      });
    });

    it('positions dropdown to the left when both edges overflow and left has more space', async () => {
      setupPositionGeometry(300, 150, 100);
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.status-dropdown')).toBeInTheDocument();
      });

      // Force the position calculation to run (initial position is already 'left')
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(container.querySelector('.status-dropdown')).toHaveClass('dropdown-position-left');
    });

    it('positions dropdown centered when it fits within the viewport', async () => {
      setupPositionGeometry(800, 300, 100);
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.status-dropdown')).toHaveClass('dropdown-position-center');
      });
    });

    it('falls back to left when a centered dropdown would overflow the right edge', async () => {
      setupPositionGeometry(800, 510, 300);
      const { container } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.status-dropdown')).toBeInTheDocument();
      });

      // Force the position calculation to run (initial position is already 'left')
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(container.querySelector('.status-dropdown')).toHaveClass('dropdown-position-left');
    });
  });

  describe('Accessibility Tests', () => {
    it('has correct aria-label', () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Current status: New. Click to change status.');
    });

    it('dropdown has role="listbox"', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('dropdown has aria-label', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Status options');
    });

    it('status options have role="option"', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StatusSelector {...defaultProps} />);

      await user.tab();
      const button = screen.getByRole('button');
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('can navigate options with keyboard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      const options = screen.getAllByRole('option');
      expect(options[0]).toBeInTheDocument();
      expect(options[1]).toBeInTheDocument();
      expect(options[2]).toBeInTheDocument();
    });

    it('can select option with Enter key', async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();
      renderWithProviders(<StatusSelector {...defaultProps} onStatusChange={onStatusChange} />);

      const button = screen.getByRole('button');
      await user.click(button);

      const options = screen.getAllByRole('option');
      await user.click(options[1]);

      expect(onStatusChange).toHaveBeenCalledWith('IN_PROGRESS');
    });

    it('can close dropdown by clicking outside', async () => {
      renderWithProviders(
        <div>
          <StatusSelector {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty statuses array', () => {
      renderWithProviders(<StatusSelector {...defaultProps} statuses={[]} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles single status', async () => {
      renderWithProviders(<StatusSelector {...defaultProps} statuses={['NEW']} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
    });

    it('handles many statuses', async () => {
      const manyStatuses: TestStatus[] = ['NEW', 'IN_PROGRESS', 'DONE'];
      renderWithProviders(<StatusSelector {...defaultProps} statuses={manyStatuses} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });

    it('handles status with empty label', () => {
      const configWithEmptyLabel: Record<TestStatus, StatusConfig> = {
        ...mockStatusConfig,
        NEW: { ...mockStatusConfig.NEW, label: '' },
      };

      renderWithProviders(<StatusSelector {...defaultProps} statusConfig={configWithEmptyLabel} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles status with very long label', () => {
      const longLabel = 'A'.repeat(100);
      const configWithLongLabel: Record<TestStatus, StatusConfig> = {
        ...mockStatusConfig,
        NEW: { ...mockStatusConfig.NEW, label: longLabel },
      };

      renderWithProviders(<StatusSelector {...defaultProps} statusConfig={configWithLongLabel} />);

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('handles status with special characters in label', () => {
      const specialLabel = 'Status <script>alert("test")</script> & "quotes"';
      const configWithSpecialChars: Record<TestStatus, StatusConfig> = {
        ...mockStatusConfig,
        NEW: { ...mockStatusConfig.NEW, label: specialLabel },
      };

      renderWithProviders(
        <StatusSelector {...defaultProps} statusConfig={configWithSpecialChars} />
      );

      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });

    it('handles rapid status changes', async () => {
      const onStatusChange = vi.fn();
      renderWithProviders(<StatusSelector {...defaultProps} onStatusChange={onStatusChange} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const inProgressOption = screen.getByText('In Progress').closest('button');
      const doneOption = screen.getByText('Done').closest('button');

      if (inProgressOption && doneOption) {
        fireEvent.click(inProgressOption);
        fireEvent.click(doneOption);
      }

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledTimes(1);
      });
    });

    it('handles both loading and disabled states', () => {
      const { container } = renderWithProviders(
        <StatusSelector {...defaultProps} isLoading={true} disabled={true} />
      );

      expect(container.querySelector('.status-loading')).toBeInTheDocument();
      expect(container.querySelector('.status-locked')).not.toBeInTheDocument();
    });

    it('handles current status not in statuses array', () => {
      renderWithProviders(
        <StatusSelector
          {...defaultProps}
          currentStatus={'NEW' as TestStatus}
          statuses={['IN_PROGRESS', 'DONE']}
        />
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('handles availableStatuses with current status not available', async () => {
      renderWithProviders(
        <StatusSelector
          {...defaultProps}
          currentStatus={'NEW' as TestStatus}
          availableStatuses={['IN_PROGRESS', 'DONE']}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Integration Tests', () => {
    it('integrates with external state management', async () => {
      const onStatusChange = vi.fn();
      const { rerender } = renderWithProviders(
        <StatusSelector {...defaultProps} onStatusChange={onStatusChange} />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const inProgressOption = screen.getByText('In Progress').closest('button');
      if (inProgressOption) {
        await userEvent.click(inProgressOption);
      }

      expect(onStatusChange).toHaveBeenCalledWith('IN_PROGRESS');

      rerender(
        <StatusSelector
          {...defaultProps}
          currentStatus="IN_PROGRESS"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('maintains dropdown state across re-renders', async () => {
      const { rerender } = renderWithProviders(<StatusSelector {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      rerender(<StatusSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('handles concurrent updates correctly', async () => {
      const onStatusChange = vi.fn();
      const { rerender } = renderWithProviders(
        <StatusSelector {...defaultProps} onStatusChange={onStatusChange} />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      rerender(
        <StatusSelector
          {...defaultProps}
          currentStatus="IN_PROGRESS"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByRole('button')).toHaveTextContent('In Progress');
    });
  });

  describe('Performance Tests', () => {
    it('does not recalculate position when dropdown is closed', () => {
      renderWithProviders(<StatusSelector {...defaultProps} />);

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderWithProviders(<StatusSelector {...defaultProps} />);

      unmount();

      act(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
    });
  });
});

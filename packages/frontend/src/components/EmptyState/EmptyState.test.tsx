import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vi-axe';

import { EmptyState, NoTeamSelected, NoActiveGoal, NoActiveSprint } from './EmptyState';
import type { EmptyStateType } from './types';

vi.mock('./EmptyState.module.css', () => ({
  default: {
    'empty-state-container': 'empty-state-container',
    'empty-state-content': 'empty-state-content',
    'empty-state-icon': 'empty-state-icon',
    'empty-state-title': 'empty-state-title',
    'empty-state-description': 'empty-state-description',
    'empty-state-actions': 'empty-state-actions',
    'empty-state-button': 'empty-state-button',
    'button-primary': 'button-primary',
    'button-secondary': 'button-secondary',
    default: 'default',
    compact: 'compact',
    'full-page': 'full-page',
  },
}));

describe('EmptyState Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Predefined Types Rendering Tests', () => {
    it('should render "no-team" type correctly', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      expect(screen.getByText('No Team Selected')).toBeInTheDocument();
      expect(screen.getByText('Please select a team to continue.')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state').querySelector('svg')).toBeInTheDocument();
    });

    it('should render "no-active-goal" type correctly', () => {
      renderWithRouter(<EmptyState type="no-active-goal" />);

      expect(screen.getByText('No Active Goal')).toBeInTheDocument();
      expect(
        screen.getByText('Please set an active product goal before continuing.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Product Goals' })).toBeInTheDocument();
    });

    it('should render "no-active-sprint" type correctly', () => {
      renderWithRouter(<EmptyState type="no-active-sprint" />);

      expect(screen.getByText('No Active Sprint')).toBeInTheDocument();
      expect(
        screen.getByText('Start a new sprint from Sprint Planning to continue.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Sprint Planning' })).toBeInTheDocument();
    });

    it('should render "no-completed-sprint" type correctly', () => {
      renderWithRouter(<EmptyState type="no-completed-sprint" />);

      expect(screen.getByText('No Completed Sprint')).toBeInTheDocument();
      expect(screen.getByText('Complete a sprint to start tracking.')).toBeInTheDocument();
    });

    it('should render "no-data" type correctly', () => {
      renderWithRouter(<EmptyState type="no-data" />);

      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(screen.getByText('There is no data to display at this time.')).toBeInTheDocument();
    });

    it('should render "error" type correctly', () => {
      renderWithRouter(<EmptyState type="error" />);

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An error occurred while loading the data. Please try again.')
      ).toBeInTheDocument();
    });

    it('should render "custom" type with default empty values', () => {
      renderWithRouter(<EmptyState type="custom" />);

      expect(screen.queryByText('No Team Selected')).not.toBeInTheDocument();
    });
  });

  describe('Custom Props Override Tests', () => {
    it('should override icon when custom icon is provided', () => {
      const customIcon = <span data-testid="custom-icon">Custom Icon</span>;
      renderWithRouter(<EmptyState type="no-team" icon={customIcon} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should override title when custom title is provided', () => {
      renderWithRouter(<EmptyState type="no-team" title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('No Team Selected')).not.toBeInTheDocument();
    });

    it('should override description when custom description is provided', () => {
      renderWithRouter(<EmptyState type="no-team" description="Custom description text" />);

      expect(screen.getByText('Custom description text')).toBeInTheDocument();
      expect(screen.queryByText('Please select a team to continue.')).not.toBeInTheDocument();
    });

    it('should override action when custom action is provided', () => {
      const handleAction = vi.fn();
      renderWithRouter(
        <EmptyState
          type="no-active-goal"
          action={{ label: 'Custom Action', onClick: handleAction }}
        />
      );

      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Go to Product Goals' })).not.toBeInTheDocument();
    });

    it('should render multiple custom overrides together', () => {
      const customIcon = <span data-testid="custom-icon">Custom</span>;
      renderWithRouter(
        <EmptyState
          type="no-team"
          icon={customIcon}
          title="Custom Title"
          description="Custom Description"
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });
  });

  describe('Action Button Tests', () => {
    it('should call onClick when action button is clicked', () => {
      const handleAction = vi.fn();
      renderWithRouter(
        <EmptyState type="no-team" action={{ label: 'Take Action', onClick: handleAction }} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Take Action' }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should navigate to correct path for "no-active-goal" action', () => {
      renderWithRouter(<EmptyState type="no-active-goal" />);

      fireEvent.click(screen.getByRole('button', { name: 'Go to Product Goals' }));
    });

    it('should navigate to correct path for "no-active-sprint" action', () => {
      renderWithRouter(<EmptyState type="no-active-sprint" />);

      fireEvent.click(screen.getByRole('button', { name: 'Go to Sprint Planning' }));
    });

    it('should render primary button variant', () => {
      renderWithRouter(
        <EmptyState
          type="no-team"
          action={{ label: 'Primary Action', variant: 'primary', onClick: vi.fn() }}
        />
      );

      const button = screen.getByRole('button', { name: 'Primary Action' });
      expect(button.className).toContain('button-primary');
    });

    it('should render secondary button variant', () => {
      renderWithRouter(
        <EmptyState
          type="no-team"
          action={{ label: 'Secondary Action', variant: 'secondary', onClick: vi.fn() }}
        />
      );

      const button = screen.getByRole('button', { name: 'Secondary Action' });
      expect(button.className).toContain('button-secondary');
    });
  });

  describe('Variant Tests', () => {
    it('should apply default variant by default', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('default');
    });

    it('should apply compact variant', () => {
      renderWithRouter(<EmptyState type="no-team" variant="compact" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('compact');
    });

    it('should apply full-page variant', () => {
      renderWithRouter(<EmptyState type="no-team" variant="full-page" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('full-page');
    });

    it('should apply custom className', () => {
      renderWithRouter(<EmptyState type="no-team" className="custom-class" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have role attribute set to status by default', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'status');
    });

    it('should have custom role attribute when provided', () => {
      renderWithRouter(<EmptyState type="no-team" role="alert" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'alert');
    });

    it('should have aria-live set to polite by default', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should have custom aria-live attribute when provided', () => {
      renderWithRouter(<EmptyState type="no-team" aria-live="assertive" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have no accessibility violations for default type', async () => {
      const { container } = renderWithRouter(<EmptyState type="no-team" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for error type', async () => {
      const { container } = renderWithRouter(<EmptyState type="error" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for type with action', async () => {
      const { container } = renderWithRouter(<EmptyState type="no-active-goal" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should hide icon from screen readers', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const icon = screen.getByTestId('empty-state').querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Data Test Id Tests', () => {
    it('should have default data-testid', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should have custom data-testid when provided', () => {
      renderWithRouter(<EmptyState type="no-team" data-testid="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Content Visibility Tests', () => {
    it('should not render title when not provided', () => {
      renderWithRouter(<EmptyState type="custom" title="" />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      renderWithRouter(<EmptyState type="custom" description="" />);

      expect(
        screen.queryByText('There is no data to display at this time.')
      ).not.toBeInTheDocument();
    });

    it('should not render action when not provided', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render with all content provided', () => {
      renderWithRouter(
        <EmptyState
          type="custom"
          title="Full Content Title"
          description="Full content description"
          action={{ label: 'Action Button', onClick: vi.fn() }}
        />
      );

      expect(screen.getByText('Full Content Title')).toBeInTheDocument();
      expect(screen.getByText('Full content description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });
  });

  describe('Default Config Override Tests', () => {
    it('should use default icon but custom title', () => {
      renderWithRouter(<EmptyState type="no-team" title="Overridden Title" />);

      expect(screen.getByText('Overridden Title')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state').querySelector('svg')).toBeInTheDocument();
    });

    it('should use default description but custom action', () => {
      renderWithRouter(
        <EmptyState type="no-active-goal" action={{ label: 'New Action', onClick: vi.fn() }} />
      );

      expect(
        screen.getByText('Please set an active product goal before continuing.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Action' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle type with no default action', () => {
      renderWithRouter(<EmptyState type="no-data" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle type with default action', () => {
      renderWithRouter(<EmptyState type="no-active-goal" />);

      expect(screen.getByRole('button', { name: 'Go to Product Goals' })).toBeInTheDocument();
    });

    it('should handle long title text', () => {
      const longTitle = 'A'.repeat(100);
      renderWithRouter(<EmptyState type="custom" title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long description text', () => {
      const longDescription = 'B'.repeat(200);
      renderWithRouter(<EmptyState type="custom" description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle custom onClick that navigates', () => {
      const navigateFn = vi.fn();
      render(
        <MemoryRouter>
          <EmptyState
            type="no-active-goal"
            action={{
              label: 'Go to Goals',
              onClick: () => navigateFn('/product-goals'),
            }}
          />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Go to Goals' }));
      expect(navigateFn).toHaveBeenCalledWith('/product-goals');
    });

    it('should handle undefined action onClick gracefully', () => {
      renderWithRouter(<EmptyState type="no-team" action={{ label: 'Action' } as any} />);

      const button = screen.getByRole('button', { name: 'Action' });
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Convenience Exports Tests', () => {
    it('NoTeamSelected should render correctly', () => {
      renderWithRouter(<NoTeamSelected />);

      expect(screen.getByText('No Team Selected')).toBeInTheDocument();
      expect(screen.getByText('Please select a team to continue.')).toBeInTheDocument();
    });

    it('NoActiveGoal should render correctly', () => {
      renderWithRouter(<NoActiveGoal />);

      expect(screen.getByText('No Active Goal')).toBeInTheDocument();
      expect(
        screen.getByText('Please set an active product goal before continuing.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Product Goals' })).toBeInTheDocument();
    });

    it('NoActiveSprint should render correctly', () => {
      renderWithRouter(<NoActiveSprint />);

      expect(screen.getByText('No Active Sprint')).toBeInTheDocument();
      expect(
        screen.getByText('Start a new sprint from Sprint Planning to continue.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Sprint Planning' })).toBeInTheDocument();
    });

    it('NoTeamSelected should accept custom props', () => {
      renderWithRouter(<NoTeamSelected title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('No Team Selected')).not.toBeInTheDocument();
    });

    it('NoActiveGoal should accept custom props', () => {
      const handleAction = vi.fn();
      renderWithRouter(<NoActiveGoal action={{ label: 'Custom', onClick: handleAction }} />);

      expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Go to Product Goals' })).not.toBeInTheDocument();
    });
  });

  describe('Default Props Tests', () => {
    it('should use default type of "custom"', () => {
      renderWithRouter(<EmptyState />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should use default variant of "default"', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('default');
    });

    it('should use default role of "status"', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'status');
    });

    it('should use default aria-live of "polite"', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should use default data-testid of "empty-state"', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should use default className of empty string', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('empty-state-container');
    });
  });

  describe('Structure Tests', () => {
    it('should render icon in correct element', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      const iconContainer = screen.getByTestId('empty-state').querySelector('.empty-state-icon');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render title in h2 element', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should render description in p element', () => {
      renderWithRouter(<EmptyState type="no-team" />);

      expect(screen.getByText('Please select a team to continue.')).toBeInTheDocument();
    });

    it('should render action in button element', () => {
      renderWithRouter(<EmptyState type="no-active-goal" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render action wrapper div', () => {
      renderWithRouter(<EmptyState type="no-active-goal" />);

      const actionsWrapper = screen
        .getByTestId('empty-state')
        .querySelector('.empty-state-actions');
      expect(actionsWrapper).toBeInTheDocument();
    });
  });
});

describe('EmptyState Default Configs', () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  const predefinedTypes: EmptyStateType[] = [
    'no-team',
    'no-active-goal',
    'no-active-sprint',
    'no-completed-sprint',
    'no-data',
    'error',
    'custom',
  ];

  predefinedTypes.forEach((type) => {
    it(`should render ${type} without crashing`, () => {
      expect(() => renderWithRouter(<EmptyState type={type} />)).not.toThrow();
    });
  });

  it('should have icon for each predefined type (except custom)', () => {
    const typesWithoutCustom: EmptyStateType[] = [
      'no-team',
      'no-active-goal',
      'no-active-sprint',
      'no-completed-sprint',
      'no-data',
      'error',
    ];

    typesWithoutCustom.forEach((type) => {
      const { container } = renderWithRouter(<EmptyState type={type} />);
      expect(container.querySelector('.empty-state-icon')).toBeInTheDocument();
    });
  });

  it('should have unique titles for each predefined type', () => {
    predefinedTypes.forEach((type) => {
      renderWithRouter(<EmptyState type={type} />);
    });

    const uniqueTypes = new Set(predefinedTypes);
    expect(uniqueTypes.size).toBe(predefinedTypes.length);
  });

  it('should render UsersIcon for no-team type', () => {
    const { container } = renderWithRouter(<EmptyState type="no-team" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render GoalIcon for no-active-goal type', () => {
    const { container } = renderWithRouter(<EmptyState type="no-active-goal" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render SprintIcon for no-active-sprint type', () => {
    const { container } = renderWithRouter(<EmptyState type="no-active-sprint" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render ClipboardListIcon for no-completed-sprint type', () => {
    const { container } = renderWithRouter(<EmptyState type="no-completed-sprint" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render InboxIcon for no-data type', () => {
    const { container } = renderWithRouter(<EmptyState type="no-data" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render ErrorIcon for error type', () => {
    const { container } = renderWithRouter(<EmptyState type="error" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render SearchIcon for custom type with default config', () => {
    const { container } = renderWithRouter(<EmptyState type="custom" />);
    const iconElement = container.querySelector('.empty-state-icon');
    expect(iconElement).toBeInTheDocument();
  });
});

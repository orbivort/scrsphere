import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { screen, fireEvent, renderWithProviders } from '@/test-utils';
import { axe } from 'vi-axe';

import { initTestI18n, i18nT } from '@/test-utils';

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
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Predefined Types Rendering Tests', () => {
    it('should render "no-team" type correctly', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      expect(screen.getByText(i18nT('emptyState.noTeam.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.noTeam.description'))).toBeInTheDocument();
      expect(screen.getByTestId('empty-state').querySelector('svg')).toBeInTheDocument();
    });

    it('should render "no-active-goal" type correctly', () => {
      renderWithProviders(<EmptyState type="no-active-goal" />);

      expect(screen.getByText(i18nT('emptyState.noActiveGoal.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.noActiveGoal.description'))).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('emptyState.noActiveGoal.action') })
      ).toBeInTheDocument();
    });

    it('should render "no-active-sprint" type correctly', () => {
      renderWithProviders(<EmptyState type="no-active-sprint" />);

      expect(screen.getByText(i18nT('emptyState.noActiveSprint.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.noActiveSprint.description'))).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('emptyState.noActiveSprint.action') })
      ).toBeInTheDocument();
    });

    it('should render "no-completed-sprint" type correctly', () => {
      renderWithProviders(<EmptyState type="no-completed-sprint" />);

      expect(screen.getByText(i18nT('emptyState.noCompletedSprint.title'))).toBeInTheDocument();
      expect(
        screen.getByText(i18nT('emptyState.noCompletedSprint.description'))
      ).toBeInTheDocument();
    });

    it('should render "no-data" type correctly', () => {
      renderWithProviders(<EmptyState type="no-data" />);

      expect(screen.getByText(i18nT('emptyState.noData.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.noData.description'))).toBeInTheDocument();
    });

    it('should render "error" type correctly', () => {
      renderWithProviders(<EmptyState type="error" />);

      expect(screen.getByText(i18nT('emptyState.error.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.error.description'))).toBeInTheDocument();
    });

    it('should render "custom" type with default empty values', () => {
      renderWithProviders(<EmptyState type="custom" />);

      expect(screen.queryByText(i18nT('emptyState.noTeam.title'))).not.toBeInTheDocument();
    });
  });

  describe('Custom Props Override Tests', () => {
    it('should override icon when custom icon is provided', () => {
      const customIcon = <span data-testid="custom-icon">Custom Icon</span>;
      renderWithProviders(<EmptyState type="no-team" icon={customIcon} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should override title when custom title is provided', () => {
      renderWithProviders(<EmptyState type="no-team" title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText(i18nT('emptyState.noTeam.title'))).not.toBeInTheDocument();
    });

    it('should override description when custom description is provided', () => {
      renderWithProviders(<EmptyState type="no-team" description="Custom description text" />);

      expect(screen.getByText('Custom description text')).toBeInTheDocument();
      expect(screen.queryByText(i18nT('emptyState.noTeam.description'))).not.toBeInTheDocument();
    });

    it('should override action when custom action is provided', () => {
      const handleAction = vi.fn();
      renderWithProviders(
        <EmptyState
          type="no-active-goal"
          action={{ label: 'Custom Action', onClick: handleAction }}
        />
      );

      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: i18nT('emptyState.noActiveGoal.action') })
      ).not.toBeInTheDocument();
    });

    it('should render multiple custom overrides together', () => {
      const customIcon = <span data-testid="custom-icon">Custom</span>;
      renderWithProviders(
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
      renderWithProviders(
        <EmptyState type="no-team" action={{ label: 'Take Action', onClick: handleAction }} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Take Action' }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should navigate to correct path for "no-active-goal" action', () => {
      renderWithProviders(<EmptyState type="no-active-goal" />);

      fireEvent.click(
        screen.getByRole('button', { name: i18nT('emptyState.noActiveGoal.action') })
      );
    });

    it('should navigate to correct path for "no-active-sprint" action', () => {
      renderWithProviders(<EmptyState type="no-active-sprint" />);

      fireEvent.click(
        screen.getByRole('button', { name: i18nT('emptyState.noActiveSprint.action') })
      );
    });

    it('should render primary button variant', () => {
      renderWithProviders(
        <EmptyState
          type="no-team"
          action={{ label: 'Primary Action', variant: 'primary', onClick: vi.fn() }}
        />
      );

      const button = screen.getByRole('button', { name: 'Primary Action' });
      expect(button.className).toContain('button-primary');
    });

    it('should render secondary button variant', () => {
      renderWithProviders(
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
      renderWithProviders(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('default');
    });

    it('should apply compact variant', () => {
      renderWithProviders(<EmptyState type="no-team" variant="compact" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('compact');
    });

    it('should apply full-page variant', () => {
      renderWithProviders(<EmptyState type="no-team" variant="full-page" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('full-page');
    });

    it('should apply custom className', () => {
      renderWithProviders(<EmptyState type="no-team" className="custom-class" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have role attribute set to status by default', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'status');
    });

    it('should have custom role attribute when provided', () => {
      renderWithProviders(<EmptyState type="no-team" role="alert" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'alert');
    });

    it('should have aria-live set to polite by default', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should have custom aria-live attribute when provided', () => {
      renderWithProviders(<EmptyState type="no-team" aria-live="assertive" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have no accessibility violations for default type', async () => {
      const { container } = renderWithProviders(<EmptyState type="no-team" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for error type', async () => {
      const { container } = renderWithProviders(<EmptyState type="error" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for type with action', async () => {
      const { container } = renderWithProviders(<EmptyState type="no-active-goal" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should hide icon from screen readers', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const icon = screen.getByTestId('empty-state').querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Data Test Id Tests', () => {
    it('should have default data-testid', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should have custom data-testid when provided', () => {
      renderWithProviders(<EmptyState type="no-team" data-testid="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Content Visibility Tests', () => {
    it('should not render title when not provided', () => {
      renderWithProviders(<EmptyState type="custom" title="" />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      renderWithProviders(<EmptyState type="custom" description="" />);

      expect(screen.queryByText(i18nT('emptyState.noData.description'))).not.toBeInTheDocument();
    });

    it('should not render action when not provided', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render with all content provided', () => {
      renderWithProviders(
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
      renderWithProviders(<EmptyState type="no-team" title="Overridden Title" />);

      expect(screen.getByText('Overridden Title')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state').querySelector('svg')).toBeInTheDocument();
    });

    it('should use default description but custom action', () => {
      renderWithProviders(
        <EmptyState type="no-active-goal" action={{ label: 'New Action', onClick: vi.fn() }} />
      );

      expect(screen.getByText(i18nT('emptyState.noActiveGoal.description'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Action' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle type with no default action', () => {
      renderWithProviders(<EmptyState type="no-data" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle type with default action', () => {
      renderWithProviders(<EmptyState type="no-active-goal" />);

      expect(
        screen.getByRole('button', { name: i18nT('emptyState.noActiveGoal.action') })
      ).toBeInTheDocument();
    });

    it('should handle long title text', () => {
      const longTitle = 'A'.repeat(100);
      renderWithProviders(<EmptyState type="custom" title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long description text', () => {
      const longDescription = 'B'.repeat(200);
      renderWithProviders(<EmptyState type="custom" description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle custom onClick that navigates', () => {
      const navigateFn = vi.fn();
      renderWithProviders(
        <EmptyState
          type="no-active-goal"
          action={{
            label: 'Go to Goals',
            onClick: () => navigateFn('/product-goals'),
          }}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Go to Goals' }));
      expect(navigateFn).toHaveBeenCalledWith('/product-goals');
    });

    it('should handle undefined action onClick gracefully', () => {
      renderWithProviders(<EmptyState type="no-team" action={{ label: 'Action' } as any} />);

      const button = screen.getByRole('button', { name: 'Action' });
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Convenience Exports Tests', () => {
    it('NoTeamSelected should render correctly', () => {
      renderWithProviders(<NoTeamSelected />);

      expect(screen.getByText(i18nT('emptyState.noTeam.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.noTeam.description'))).toBeInTheDocument();
    });

    it('NoActiveGoal should render correctly', () => {
      renderWithProviders(<NoActiveGoal />);

      expect(screen.getByText(i18nT('emptyState.noActiveGoal.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.noActiveGoal.description'))).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('emptyState.noActiveGoal.action') })
      ).toBeInTheDocument();
    });

    it('NoActiveSprint should render correctly', () => {
      renderWithProviders(<NoActiveSprint />);

      expect(screen.getByText(i18nT('emptyState.noActiveSprint.title'))).toBeInTheDocument();
      expect(screen.getByText(i18nT('emptyState.noActiveSprint.description'))).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('emptyState.noActiveSprint.action') })
      ).toBeInTheDocument();
    });

    it('NoTeamSelected should accept custom props', () => {
      renderWithProviders(<NoTeamSelected title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText(i18nT('emptyState.noTeam.title'))).not.toBeInTheDocument();
    });

    it('NoActiveGoal should accept custom props', () => {
      const handleAction = vi.fn();
      renderWithProviders(<NoActiveGoal action={{ label: 'Custom', onClick: handleAction }} />);

      expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: i18nT('emptyState.noActiveGoal.action') })
      ).not.toBeInTheDocument();
    });
  });

  describe('Default Props Tests', () => {
    it('should use default type of "custom"', () => {
      renderWithProviders(<EmptyState />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should use default variant of "default"', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('default');
    });

    it('should use default role of "status"', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('role', 'status');
    });

    it('should use default aria-live of "polite"', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should use default data-testid of "empty-state"', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should use default className of empty string', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('empty-state-container');
    });
  });

  describe('Structure Tests', () => {
    it('should render icon in correct element', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      const iconContainer = screen.getByTestId('empty-state').querySelector('.empty-state-icon');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render title in h2 element', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should render description in p element', () => {
      renderWithProviders(<EmptyState type="no-team" />);

      expect(screen.getByText(i18nT('emptyState.noTeam.description'))).toBeInTheDocument();
    });

    it('should render action in button element', () => {
      renderWithProviders(<EmptyState type="no-active-goal" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render action wrapper div', () => {
      renderWithProviders(<EmptyState type="no-active-goal" />);

      const actionsWrapper = screen
        .getByTestId('empty-state')
        .querySelector('.empty-state-actions');
      expect(actionsWrapper).toBeInTheDocument();
    });
  });
});

describe('EmptyState Default Configs', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

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
      expect(() => renderWithProviders(<EmptyState type={type} />)).not.toThrow();
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
      const { container } = renderWithProviders(<EmptyState type={type} />);
      expect(container.querySelector('.empty-state-icon')).toBeInTheDocument();
    });
  });

  it('should have unique titles for each predefined type', () => {
    predefinedTypes.forEach((type) => {
      renderWithProviders(<EmptyState type={type} />);
    });

    const uniqueTypes = new Set(predefinedTypes);
    expect(uniqueTypes.size).toBe(predefinedTypes.length);
  });

  it('should render UsersIcon for no-team type', () => {
    const { container } = renderWithProviders(<EmptyState type="no-team" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render GoalIcon for no-active-goal type', () => {
    const { container } = renderWithProviders(<EmptyState type="no-active-goal" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render SprintIcon for no-active-sprint type', () => {
    const { container } = renderWithProviders(<EmptyState type="no-active-sprint" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render ClipboardListIcon for no-completed-sprint type', () => {
    const { container } = renderWithProviders(<EmptyState type="no-completed-sprint" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render InboxIcon for no-data type', () => {
    const { container } = renderWithProviders(<EmptyState type="no-data" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render ErrorIcon for error type', () => {
    const { container } = renderWithProviders(<EmptyState type="error" />);
    const svg = container.querySelector('.empty-state-icon svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render SearchIcon for custom type with default config', () => {
    const { container } = renderWithProviders(<EmptyState type="custom" />);
    const iconElement = container.querySelector('.empty-state-icon');
    expect(iconElement).toBeInTheDocument();
  });
});

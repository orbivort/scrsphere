import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import {
  UsersIcon,
  GoalIcon,
  SprintIcon,
  RunningIcon,
  InboxIcon,
  ErrorIcon,
  SearchIcon,
  FlagIcon,
  ClipboardListIcon,
  ArrowRightIcon,
} from './icons';

describe('EmptyState Icons', () => {
  describe('UsersIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<UsersIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<UsersIcon size={32} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    it('should apply custom className', () => {
      const { container } = render(<UsersIcon className="custom-users-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-users-icon');
    });

    it('should render SVG element', () => {
      const { container } = render(<UsersIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('GoalIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<GoalIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<GoalIcon size={48} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('should apply custom className', () => {
      const { container } = render(<GoalIcon className="goal-icon-class" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('goal-icon-class');
    });
  });

  describe('SprintIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<SprintIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<SprintIcon size={96} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '96');
      expect(svg).toHaveAttribute('height', '96');
    });

    it('should apply custom className', () => {
      const { container } = render(<SprintIcon className="sprint-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('sprint-icon');
    });
  });

  describe('RunningIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<RunningIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<RunningIcon size={24} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('should apply custom className', () => {
      const { container } = render(<RunningIcon className="running-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('running-icon');
    });
  });

  describe('InboxIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<InboxIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<InboxIcon size={40} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '40');
      expect(svg).toHaveAttribute('height', '40');
    });

    it('should apply custom className', () => {
      const { container } = render(<InboxIcon className="inbox-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('inbox-icon');
    });
  });

  describe('ErrorIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<ErrorIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<ErrorIcon size={56} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '56');
      expect(svg).toHaveAttribute('height', '56');
    });

    it('should apply custom className', () => {
      const { container } = render(<ErrorIcon className="error-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('error-icon');
    });
  });

  describe('SearchIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<SearchIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<SearchIcon size={28} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '28');
      expect(svg).toHaveAttribute('height', '28');
    });

    it('should apply custom className', () => {
      const { container } = render(<SearchIcon className="search-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('search-icon');
    });
  });

  describe('FlagIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<FlagIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<FlagIcon size={72} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '72');
      expect(svg).toHaveAttribute('height', '72');
    });

    it('should apply custom className', () => {
      const { container } = render(<FlagIcon className="flag-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('flag-icon');
    });
  });

  describe('ClipboardListIcon', () => {
    it('should render with default size of 64', () => {
      const { container } = render(<ClipboardListIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('should render with custom size', () => {
      const { container } = render(<ClipboardListIcon size={36} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '36');
      expect(svg).toHaveAttribute('height', '36');
    });

    it('should apply custom className', () => {
      const { container } = render(<ClipboardListIcon className="clipboard-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('clipboard-icon');
    });
  });

  describe('ArrowRightIcon', () => {
    it('should render with default size of 16', () => {
      const { container } = render(<ArrowRightIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('should render with custom size', () => {
      const { container } = render(<ArrowRightIcon size={24} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('should apply custom className', () => {
      const { container } = render(<ArrowRightIcon className="arrow-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('arrow-icon');
    });
  });

  describe('Icon Consistency Tests', () => {
    it('should render all icons without crashing', () => {
      const icons = [
        { Component: UsersIcon, name: 'UsersIcon' },
        { Component: GoalIcon, name: 'GoalIcon' },
        { Component: SprintIcon, name: 'SprintIcon' },
        { Component: RunningIcon, name: 'RunningIcon' },
        { Component: InboxIcon, name: 'InboxIcon' },
        { Component: ErrorIcon, name: 'ErrorIcon' },
        { Component: SearchIcon, name: 'SearchIcon' },
        { Component: FlagIcon, name: 'FlagIcon' },
        { Component: ClipboardListIcon, name: 'ClipboardListIcon' },
        { Component: ArrowRightIcon, name: 'ArrowRightIcon' },
      ];

      icons.forEach(({ Component, name }) => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg'), `${name} should render an SVG`).toBeInTheDocument();
      });
    });

    it('should forward size prop correctly to all icons', () => {
      const customSize = 42;
      const icons = [
        UsersIcon,
        GoalIcon,
        SprintIcon,
        RunningIcon,
        InboxIcon,
        ErrorIcon,
        SearchIcon,
        FlagIcon,
        ClipboardListIcon,
      ];

      icons.forEach((IconComponent) => {
        const { container } = render(<IconComponent size={customSize} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', String(customSize));
        expect(svg).toHaveAttribute('height', String(customSize));
      });
    });

    it('should forward className prop correctly to all icons', () => {
      const customClass = 'test-icon-class';
      const icons = [
        UsersIcon,
        GoalIcon,
        SprintIcon,
        RunningIcon,
        InboxIcon,
        ErrorIcon,
        SearchIcon,
        FlagIcon,
        ClipboardListIcon,
        ArrowRightIcon,
      ];

      icons.forEach((IconComponent) => {
        const { container } = render(<IconComponent className={customClass} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass(customClass);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle size of 0 gracefully', () => {
      const { container } = render(<UsersIcon size={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '0');
      expect(svg).toHaveAttribute('height', '0');
    });

    it('should handle very large size values', () => {
      const { container } = render(<UsersIcon size={1000} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '1000');
      expect(svg).toHaveAttribute('height', '1000');
    });

    it('should handle empty className', () => {
      const { container } = render(<UsersIcon className="" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle multiple CSS classes in className', () => {
      const { container } = render(<UsersIcon className="class1 class2 class3" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('class1');
      expect(svg).toHaveClass('class2');
      expect(svg).toHaveClass('class3');
    });
  });

  describe('Accessibility', () => {
    it('should render SVG elements that can be marked as aria-hidden', () => {
      const { container } = render(
        <span aria-hidden="true">
          <UsersIcon />
        </span>
      );
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render icons that are purely presentational', () => {
      const { container } = render(<UsersIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});

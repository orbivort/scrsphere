import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen, fireEvent, renderWithProviders } from '@/test-utils';
import userEvent from '@testing-library/user-event';

import { initTestI18n } from '@/test-utils';
import { Button } from './Button';

// Mock CSS modules
vi.mock('./Button.module.css', () => ({
  default: {
    button: 'button',
    'button-primary': 'button-primary',
    'button-secondary': 'button-secondary',
    'button-link': 'button-link',
    'button-danger': 'button-danger',
    'button-sm': 'button-sm',
    'button-md': 'button-md',
    'button-lg': 'button-lg',
    'button-loading': 'button-loading',
    spinner: 'spinner',
    'spinner-icon': 'spinner-icon',
    'button-text': 'button-text',
  },
}));

describe('Button Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  describe('Component Rendering Tests', () => {
    it('renders with default props', () => {
      renderWithProviders(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      renderWithProviders(<Button>Test Button</Button>);

      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('renders with primary variant by default', () => {
      renderWithProviders(<Button>Primary Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-primary');
    });

    it('renders with secondary variant', () => {
      renderWithProviders(<Button variant="secondary">Secondary Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-secondary');
    });

    it('renders with link variant', () => {
      renderWithProviders(<Button variant="link">Link Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-link');
    });

    it('renders with danger variant', () => {
      renderWithProviders(<Button variant="danger">Danger Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-danger');
    });

    it('renders with medium size by default', () => {
      renderWithProviders(<Button>Medium Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-md');
    });

    it('renders with small size', () => {
      renderWithProviders(<Button size="sm">Small Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-sm');
    });

    it('renders with large size', () => {
      renderWithProviders(<Button size="lg">Large Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-lg');
    });

    it('applies custom className', () => {
      renderWithProviders(<Button className="custom-class">Custom Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('combines multiple CSS classes correctly', () => {
      renderWithProviders(
        <Button variant="primary" size="lg" className="extra-class">
          Combined Classes
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button');
      expect(button).toHaveClass('button-primary');
      expect(button).toHaveClass('button-lg');
      expect(button).toHaveClass('extra-class');
    });
  });

  describe('Loading State Tests', () => {
    it('renders loading spinner when loading is true', () => {
      renderWithProviders(<Button loading>Loading Button</Button>);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('does not render spinner when loading is false', () => {
      renderWithProviders(<Button loading={false}>Normal Button</Button>);

      const spinner = document.querySelector('.spinner');
      expect(spinner).not.toBeInTheDocument();
    });

    it('applies loading class when loading', () => {
      renderWithProviders(<Button loading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('button-loading');
    });

    it('disables button when loading', () => {
      renderWithProviders(<Button loading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('has aria-busy="true" when loading', () => {
      renderWithProviders(<Button loading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy="false" when not loading', () => {
      renderWithProviders(<Button loading={false}>Normal Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('spinner has aria-hidden="true"', () => {
      renderWithProviders(<Button loading>Loading Button</Button>);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies button-text class to text when loading', () => {
      renderWithProviders(<Button loading>Loading Button</Button>);

      const textSpan = screen.getByText('Loading Button');
      expect(textSpan).toHaveClass('button-text');
    });

    it('does not apply button-text class when not loading', () => {
      renderWithProviders(<Button>Normal Button</Button>);

      const textSpan = screen.getByText('Normal Button');
      expect(textSpan).not.toHaveClass('button-text');
    });
  });

  describe('Disabled State Tests', () => {
    it('disables button when disabled prop is true', () => {
      renderWithProviders(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not disable button by default', () => {
      renderWithProviders(<Button>Enabled Button</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('disables button when both disabled and loading', () => {
      renderWithProviders(
        <Button disabled loading>
          Disabled Loading Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('User Interaction Tests', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = vi.fn();
      renderWithProviders(<Button onClick={handleClick}>Clickable Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      renderWithProviders(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      renderWithProviders(
        <Button onClick={handleClick} loading>
          Loading Button
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Button>Focusable Button</Button>);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
    });

    it('can be activated with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithProviders(<Button onClick={handleClick}>Enter Button</Button>);

      const button = screen.getByRole('button');
      await user.type(button, '{enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('can be activated with Space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithProviders(<Button onClick={handleClick}>Space Button</Button>);

      const button = screen.getByRole('button');
      await user.type(button, ' ');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('HTML Attributes Tests', () => {
    it('forwards type attribute', () => {
      renderWithProviders(<Button type="submit">Submit Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('forwards type="button" attribute', () => {
      renderWithProviders(<Button type="button">Button Type</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('forwards id attribute', () => {
      renderWithProviders(<Button id="test-button">Button with ID</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'test-button');
    });

    it('forwards data attributes', () => {
      renderWithProviders(<Button data-testid="custom-button">Button with Data</Button>);

      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });

    it('forwards aria attributes', () => {
      renderWithProviders(
        <Button aria-label="Close dialog" aria-expanded="false">
          Close
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('forwards title attribute', () => {
      renderWithProviders(<Button title="Click for more info">Info Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Click for more info');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      renderWithProviders(<Button />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('handles numeric children', () => {
      renderWithProviders(<Button>{42}</Button>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles React element children', () => {
      renderWithProviders(
        <Button>
          <span data-testid="child-span">Child Element</span>
        </Button>
      );

      expect(screen.getByTestId('child-span')).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      renderWithProviders(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const longText = 'Very long button text that should be displayed properly';
      renderWithProviders(<Button>{longText}</Button>);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in children', () => {
      renderWithProviders(<Button>Special &lt;chars&gt; & "quotes"</Button>);

      expect(screen.getByText('Special <chars> & "quotes"')).toBeInTheDocument();
    });

    it('handles all variant combinations', () => {
      const variants: Array<'primary' | 'secondary' | 'link' | 'danger'> = [
        'primary',
        'secondary',
        'link',
        'danger',
      ];

      variants.forEach((variant) => {
        const { container } = renderWithProviders(<Button variant={variant}>{variant}</Button>);
        const button = container.querySelector('button');
        expect(button).toHaveClass(`button-${variant}`);
      });
    });

    it('handles all size combinations', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

      sizes.forEach((size) => {
        const { container } = renderWithProviders(<Button size={size}>{size}</Button>);
        const button = container.querySelector('button');
        expect(button).toHaveClass(`button-${size}`);
      });
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLButtonElement | null };
      renderWithProviders(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe('BUTTON');
    });

    it('ref has access to button methods', () => {
      const ref = { current: null as HTMLButtonElement | null };
      renderWithProviders(<Button ref={ref}>Ref Button</Button>);

      expect(typeof ref.current?.click).toBe('function');
      expect(typeof ref.current?.focus).toBe('function');
    });
  });

  describe('Event Handler Tests', () => {
    it('handles onMouseEnter event', () => {
      const handleMouseEnter = vi.fn();
      renderWithProviders(<Button onMouseEnter={handleMouseEnter}>Hover Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('handles onMouseLeave event', () => {
      const handleMouseLeave = vi.fn();
      renderWithProviders(<Button onMouseLeave={handleMouseLeave}>Hover Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.mouseLeave(button);

      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles onFocus event', () => {
      const handleFocus = vi.fn();
      renderWithProviders(<Button onFocus={handleFocus}>Focus Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur event', () => {
      const handleBlur = vi.fn();
      renderWithProviders(<Button onBlur={handleBlur}>Blur Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.blur(button);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });
});

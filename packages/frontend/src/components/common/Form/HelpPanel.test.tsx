import { render, screen, fireEvent } from '@testing-library/react';

import { HelpPanel } from './HelpPanel';

describe('HelpPanel', () => {
  const defaultProps = {
    title: 'writing goal titles',
    tips: [
      'Be specific about what you want to achieve',
      'Start with a verb when possible',
      'Keep it concise for quick scanning',
    ],
  };

  it('should render help trigger button', () => {
    render(<HelpPanel {...defaultProps} />);

    expect(screen.getByText('Tips for writing goal titles')).toBeInTheDocument();
    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('should expand when clicked', () => {
    render(<HelpPanel {...defaultProps} />);

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should display all tips when expanded', () => {
    render(<HelpPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    defaultProps.tips.forEach((tip) => {
      expect(screen.getByText(tip)).toBeInTheDocument();
    });
  });

  it('should collapse when clicked again', () => {
    render(<HelpPanel {...defaultProps} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByRole('region')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('should render good example when provided', () => {
    const propsWithExamples = {
      ...defaultProps,
      examples: {
        good: { label: 'Good', text: 'Launch mobile app v2.0' },
      },
    };

    render(<HelpPanel {...propsWithExamples} />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('✓ Good example:')).toBeInTheDocument();
    expect(screen.getByText('Launch mobile app v2.0')).toBeInTheDocument();
  });

  it('should render avoid example when provided', () => {
    const propsWithExamples = {
      ...defaultProps,
      examples: {
        avoid: { label: 'Avoid', text: 'App improvements' },
      },
    };

    render(<HelpPanel {...propsWithExamples} />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('✗ Avoid:')).toBeInTheDocument();
    expect(screen.getByText('App improvements')).toBeInTheDocument();
  });

  it('should render both examples when provided', () => {
    const propsWithBothExamples = {
      ...defaultProps,
      examples: {
        good: { label: 'Good', text: 'Launch mobile app v2.0' },
        avoid: { label: 'Avoid', text: 'App improvements' },
      },
    };

    render(<HelpPanel {...propsWithBothExamples} />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('✓ Good example:')).toBeInTheDocument();
    expect(screen.getByText('✗ Avoid:')).toBeInTheDocument();
  });

  it('should have correct aria attributes', () => {
    render(<HelpPanel {...defaultProps} />);

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-controls', 'help-content');
  });

  it('should be type button to prevent form submission', () => {
    render(<HelpPanel {...defaultProps} />);

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('type', 'button');
  });
});

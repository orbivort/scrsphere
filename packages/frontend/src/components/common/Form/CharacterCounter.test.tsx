import { render, screen } from '@testing-library/react';

import { CharacterCounter } from './CharacterCounter';
import styles from './CharacterCounter.module.css';

describe('CharacterCounter', () => {
  it('should render current and max count', () => {
    render(<CharacterCounter current={50} max={100} />);

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should show neutral state when empty', () => {
    render(<CharacterCounter current={0} max={100} />);

    const counter = screen.getByTestId('character-counter');
    expect(counter).toHaveClass(styles.neutral);
  });

  it('should show valid state when within limits', () => {
    render(<CharacterCounter current={50} max={100} />);

    const counter = screen.getByTestId('character-counter');
    expect(counter).toHaveClass(styles.valid);
  });

  it('should show warning state when under minimum', () => {
    render(<CharacterCounter current={2} min={5} max={100} showMin />);

    const counter = screen.getByTestId('character-counter');
    expect(counter).toHaveClass(styles.warning);
    expect(screen.getByText(/min 5/)).toBeInTheDocument();
  });

  it('should show error state when over limit', () => {
    render(<CharacterCounter current={150} max={100} />);

    const counter = screen.getByTestId('character-counter');
    expect(counter).toHaveClass(styles.error);
  });

  it('should not show min indicator when showMin is false', () => {
    render(<CharacterCounter current={2} min={5} max={100} showMin={false} />);

    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('should not show min indicator when current is above minimum', () => {
    render(<CharacterCounter current={10} min={5} max={100} showMin />);

    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('should have aria-live polite for accessibility', () => {
    render(<CharacterCounter current={50} max={100} />);

    const counter = screen.getByTestId('character-counter');
    expect(counter).toHaveAttribute('aria-live', 'polite');
  });
});

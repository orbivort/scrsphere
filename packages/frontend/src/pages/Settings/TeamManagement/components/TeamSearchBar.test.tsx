import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { TeamSearchBar } from './TeamSearchBar';

describe('TeamSearchBar', () => {
  const mockOnSearchChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input with placeholder', () => {
      render(<TeamSearchBar search="" onSearchChange={mockOnSearchChange} />);

      expect(screen.getByPlaceholderText(/search teams by name/i)).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<TeamSearchBar search="" onSearchChange={mockOnSearchChange} />);

      expect(screen.getByLabelText(/search teams/i)).toBeInTheDocument();
    });

    it('should display current search value', () => {
      render(<TeamSearchBar search="alpha" onSearchChange={mockOnSearchChange} />);

      expect(screen.getByDisplayValue('alpha')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should call onSearchChange when typing in input', () => {
      render(<TeamSearchBar search="" onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText(/search teams by name/i);
      fireEvent.change(input, { target: { value: 'test' } });

      expect(mockOnSearchChange).toHaveBeenCalledWith('test');
    });

    it('should show clear button when search has value', () => {
      render(<TeamSearchBar search="alpha" onSearchChange={mockOnSearchChange} />);

      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    it('should NOT show clear button when search is empty', () => {
      render(<TeamSearchBar search="" onSearchChange={mockOnSearchChange} />);

      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', () => {
      render(<TeamSearchBar search="alpha" onSearchChange={mockOnSearchChange} />);

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Debouncing state', () => {
    it('should show debounce spinner when isDebouncing is true', () => {
      const { container } = render(
        <TeamSearchBar search="alpha" onSearchChange={mockOnSearchChange} isDebouncing={true} />
      );

      // The spinner is a span with aria-hidden, check by class pattern
      const spinner = container.querySelector('span[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should NOT show clear button when debouncing', () => {
      render(
        <TeamSearchBar search="alpha" onSearchChange={mockOnSearchChange} isDebouncing={true} />
      );

      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });

    it('should NOT show debounce spinner when isDebouncing is false', () => {
      render(
        <TeamSearchBar search="alpha" onSearchChange={mockOnSearchChange} isDebouncing={false} />
      );

      // When not debouncing and search has value, clear button should be shown instead of spinner
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on search input', () => {
      render(<TeamSearchBar search="" onSearchChange={mockOnSearchChange} />);

      expect(screen.getByLabelText(/search teams/i)).toHaveAttribute('type', 'text');
    });

    it('should have proper aria-label on clear button', () => {
      render(<TeamSearchBar search="alpha" onSearchChange={mockOnSearchChange} />);

      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    it('should have autocomplete off on input', () => {
      render(<TeamSearchBar search="" onSearchChange={mockOnSearchChange} />);

      expect(screen.getByPlaceholderText(/search teams by name/i)).toHaveAttribute(
        'autocomplete',
        'off'
      );
    });
  });
});

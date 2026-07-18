import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleDateInput } from './LocaleDateInput';
import { useI18nStore } from '../../../i18n/useI18nStore';
import type { Locale } from '@scrumooth/shared';

// Mock the i18n store
vi.mock('../../../i18n/useI18nStore', () => ({
  useI18nStore: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('LocaleDateInput', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to English locale
    vi.mocked(useI18nStore).mockReturnValue({
      locale: 'en' as Locale,
      setLocale: vi.fn(),
    });
  });

  it('should render with English locale format (dd/MM/yyyy)', () => {
    render(<LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('15/06/2024');
    expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy');
  });

  it('should render with German locale format (dd.MM.yyyy)', () => {
    vi.mocked(useI18nStore).mockReturnValue({
      locale: 'de' as Locale,
      setLocale: vi.fn(),
    });

    render(<LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('15.06.2024');
    expect(input).toHaveAttribute('placeholder', 'tt.mm.jjjj');
  });

  it('should render with French locale format (dd/MM/yyyy)', () => {
    vi.mocked(useI18nStore).mockReturnValue({
      locale: 'fr' as Locale,
      setLocale: vi.fn(),
    });

    render(<LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('15/06/2024');
    expect(input).toHaveAttribute('placeholder', 'jj/mm/aaaa');
  });

  it('should render with Spanish locale format (dd/MM/yyyy)', () => {
    vi.mocked(useI18nStore).mockReturnValue({
      locale: 'es' as Locale,
      setLocale: vi.fn(),
    });

    render(<LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('15/06/2024');
    expect(input).toHaveAttribute('placeholder', 'dd/mm/aaaa');
  });

  it('should render with Italian locale format (dd/MM/yyyy)', () => {
    vi.mocked(useI18nStore).mockReturnValue({
      locale: 'it' as Locale,
      setLocale: vi.fn(),
    });

    render(<LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('15/06/2024');
    expect(input).toHaveAttribute('placeholder', 'gg/mm/aaaa');
  });

  it('should call onChange with ISO format when valid date is entered', () => {
    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '15/06/2024' } });

    expect(mockOnChange).toHaveBeenCalledWith('2024-06-15');
  });

  it('should call onChange with ISO format for German locale', () => {
    vi.mocked(useI18nStore).mockReturnValue({
      locale: 'de' as Locale,
      setLocale: vi.fn(),
    });

    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '15.06.2024' } });

    expect(mockOnChange).toHaveBeenCalledWith('2024-06-15');
  });

  it('should not call onChange for incomplete date', () => {
    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '15/06' } });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should call onBlur with ISO format when focus leaves', () => {
    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} onBlur={mockOnBlur} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '15/06/2024' } });
    fireEvent.blur(input);

    expect(mockOnBlur).toHaveBeenCalledWith('2024-06-15');
  });

  it('should clear the input when clear button is clicked', () => {
    render(<LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} />);

    const clearButton = screen.getByRole('button', { name: /clearDate/i });
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should show error state when hasError is true', () => {
    render(
      <LocaleDateInput
        id="test-date"
        value=""
        onChange={mockOnChange}
        hasError={true}
        errorId="date-error"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'date-error');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} disabled={true} />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should update display when value prop changes externally', () => {
    const { rerender } = render(
      <LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('15/06/2024');

    rerender(<LocaleDateInput id="test-date" value="2024-12-25" onChange={mockOnChange} />);

    expect(input).toHaveValue('25/12/2024');
  });

  it('should not show clear button when disabled', () => {
    render(
      <LocaleDateInput id="test-date" value="2024-06-15" onChange={mockOnChange} disabled={true} />
    );

    expect(screen.queryByRole('button', { name: /clearDate/i })).not.toBeInTheDocument();
  });

  it('should render empty input when value is empty string', () => {
    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('should apply custom className', () => {
    render(
      <LocaleDateInput
        id="test-date"
        value="2024-06-15"
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    const wrapper = screen.getByRole('textbox').parentElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have a hidden date input for calendar picker', () => {
    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    // Check that there's a hidden date input
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('aria-hidden', 'true');
  });

  it('should have a calendar button', () => {
    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    const calendarButton = screen.getByRole('button', { name: /openCalendar/i });
    expect(calendarButton).toBeInTheDocument();
    expect(calendarButton).toHaveAttribute('type', 'button');
  });

  it('should call showPicker when calendar button is clicked', () => {
    const mockShowPicker = vi.fn();

    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    // Mock the showPicker method on the date input
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      Object.defineProperty(dateInput, 'showPicker', {
        value: mockShowPicker,
        writable: true,
      });

      const calendarButton = screen.getByRole('button', { name: /openCalendar/i });
      fireEvent.click(calendarButton);

      expect(mockShowPicker).toHaveBeenCalled();
    }
  });

  it('should sync date from hidden input to text input', () => {
    render(<LocaleDateInput id="test-date" value="" onChange={mockOnChange} />);

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2024-06-15' } });

      expect(mockOnChange).toHaveBeenCalledWith('2024-06-15');
    }
  });
});

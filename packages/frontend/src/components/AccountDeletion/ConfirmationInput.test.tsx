import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmationInput } from './ConfirmationInput';

vi.mock('./ConfirmationInput.module.css', () => ({
  default: {
    'confirmation-section': 'confirmation-section',
    'confirmation-label': 'confirmation-label',
    'confirmation-phrase': 'confirmation-phrase',
    'confirmation-input': 'confirmation-input',
    'confirmation-input-valid': 'confirmation-input-valid',
    'confirmation-input-invalid': 'confirmation-input-invalid',
    'confirmation-error': 'confirmation-error',
    'confirmation-error-icon': 'confirmation-error-icon',
    'confirmation-error-text': 'confirmation-error-text',
    'confirmation-success': 'confirmation-success',
    'confirmation-success-icon': 'confirmation-success-icon',
    'confirmation-success-text': 'confirmation-success-text',
  },
}));

describe('ConfirmationInput Component', () => {
  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();
  const requiredPhrase = 'DELETE MY ACCOUNT';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render the label with required phrase', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      expect(screen.getByText('To confirm deletion, please type:')).toBeInTheDocument();
      expect(screen.getByText(requiredPhrase)).toBeInTheDocument();
    });

    it('should render the input field', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with correct placeholder', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', `Type "${requiredPhrase}" to confirm`);
    });

    it('should display the current value', () => {
      render(<ConfirmationInput value="DELETE MY" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('DELETE MY');
    });

    it('should render with custom required phrase', () => {
      const customPhrase = 'CONFIRM DELETE';
      render(
        <ConfirmationInput
          value=""
          onChange={mockOnChange}
          isValid={false}
          requiredPhrase={customPhrase}
        />
      );

      expect(screen.getByText(customPhrase)).toBeInTheDocument();
    });
  });

  describe('Border State Tests', () => {
    it('should show neutral border when input is empty', () => {
      const { container } = render(
        <ConfirmationInput value="" onChange={mockOnChange} isValid={false} />
      );

      const input = container.querySelector('.confirmation-input');
      expect(input).not.toHaveClass('confirmation-input-valid');
      expect(input).not.toHaveClass('confirmation-input-invalid');
    });

    it('should show green border when valid phrase is entered', () => {
      const { container } = render(
        <ConfirmationInput value={requiredPhrase} onChange={mockOnChange} isValid />
      );

      const input = container.querySelector('.confirmation-input');
      expect(input).toHaveClass('confirmation-input-valid');
    });

    it('should show red border when invalid phrase is entered', () => {
      const { container } = render(
        <ConfirmationInput value="WRONG PHRASE" onChange={mockOnChange} isValid={false} />
      );

      const input = container.querySelector('.confirmation-input');
      expect(input).toHaveClass('confirmation-input-invalid');
    });

    it('should show success message when valid', () => {
      render(<ConfirmationInput value={requiredPhrase} onChange={mockOnChange} isValid />);

      expect(screen.getByText('Confirmation phrase matches')).toBeInTheDocument();
    });

    it('should show error message when invalid', () => {
      render(<ConfirmationInput value="WRONG" onChange={mockOnChange} isValid={false} />);

      expect(screen.getByText(/Phrase does not match/)).toBeInTheDocument();
    });

    it('should not show error or success message when empty', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      expect(screen.queryByText('Confirmation phrase matches')).not.toBeInTheDocument();
      expect(screen.queryByText(/Phrase does not match/)).not.toBeInTheDocument();
    });
  });

  describe('onChange Callback Tests', () => {
    it('should call onChange with value when input changes', async () => {
      const user = userEvent.setup();
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'DELETE');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should call onChange for each character typed', async () => {
      const user = userEvent.setup();
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'ABC');

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Enter Key Submission Tests', () => {
    it('should call onSubmit when Enter is pressed and value is valid', () => {
      render(
        <ConfirmationInput
          value={requiredPhrase}
          onChange={mockOnChange}
          isValid
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when Enter is pressed and value is invalid', () => {
      render(
        <ConfirmationInput
          value="WRONG"
          onChange={mockOnChange}
          isValid={false}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when Enter is pressed and input is empty', () => {
      render(
        <ConfirmationInput
          value=""
          onChange={mockOnChange}
          isValid={false}
          onSubmit={mockOnSubmit}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when onSubmit callback is not provided', () => {
      render(<ConfirmationInput value={requiredPhrase} onChange={mockOnChange} isValid />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should not throw error
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when disabled', () => {
      render(
        <ConfirmationInput
          value={requiredPhrase}
          onChange={mockOnChange}
          isValid
          onSubmit={mockOnSubmit}
          disabled
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State Tests', () => {
    it('should disable input when disabled prop is true', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should enable input by default', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have aria-invalid when input is invalid', () => {
      render(<ConfirmationInput value="WRONG" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not have aria-invalid when input is empty', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should not have aria-invalid when input is valid', () => {
      render(<ConfirmationInput value={requiredPhrase} onChange={mockOnChange} isValid />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have aria-required="true"', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should have aria-describedby pointing to instructions', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input.getAttribute('aria-describedby')).toContain(
        'deletion-confirmation-instructions'
      );
    });

    it('should include error id in aria-describedby when invalid', () => {
      render(<ConfirmationInput value="WRONG" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input.getAttribute('aria-describedby')).toContain('deletion-confirmation-error');
    });

    it('should have role="alert" on error message', () => {
      render(<ConfirmationInput value="WRONG" onChange={mockOnChange} isValid={false} />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should have role="status" on success message', () => {
      render(<ConfirmationInput value={requiredPhrase} onChange={mockOnChange} isValid />);

      const successMessage = screen.getByRole('status');
      expect(successMessage).toBeInTheDocument();
    });

    it('should have proper id attribute on input', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} id="custom-id" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('should have default id on input', () => {
      render(<ConfirmationInput value="" onChange={mockOnChange} isValid={false} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'deletion-confirmation');
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle partial valid phrase', () => {
      const { container } = render(
        <ConfirmationInput value="DELETE MY ACC" onChange={mockOnChange} isValid={false} />
      );

      const input = container.querySelector('.confirmation-input');
      expect(input).toHaveClass('confirmation-input-invalid');
    });

    it('should handle case-sensitive matching', () => {
      const { container } = render(
        <ConfirmationInput value="delete my account" onChange={mockOnChange} isValid={false} />
      );

      const input = container.querySelector('.confirmation-input');
      expect(input).toHaveClass('confirmation-input-invalid');
    });

    it('should handle extra whitespace', () => {
      const { container } = render(
        <ConfirmationInput value="  DELETE MY ACCOUNT  " onChange={mockOnChange} isValid={false} />
      );

      const input = container.querySelector('.confirmation-input');
      expect(input).toHaveClass('confirmation-input-invalid');
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { DefinitionEditor } from './DefinitionEditor';
import { DOR_CATEGORIES } from './categories';

const mockItems = [
  { id: 'item-1', description: 'Test item 1', category: 'requirements', isActive: true, order: 0 },
  { id: 'item-2', description: 'Test item 2', category: 'testing', isActive: false, order: 1 },
];

const mockCategories = DOR_CATEGORIES;

describe('DefinitionEditor', () => {
  let onSaveMock: ReturnType<typeof vi.fn>;
  let onCancelMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSaveMock = vi.fn();
    onCancelMock = vi.fn();
  });

  it('should render with initial items', () => {
    render(
      <DefinitionEditor
        definition={{ items: mockItems, version: 1, updatedAt: '2024-01-01T00:00:00Z' }}
        definitionType="DoR"
        categories={mockCategories}
        onSave={onSaveMock}
        onCancel={onCancelMock}
      />
    );
    expect(screen.getByDisplayValue('Test item 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test item 2')).toBeInTheDocument();
  });

  it('should add a new item', () => {
    render(
      <DefinitionEditor
        definition={{ items: [], version: 1, updatedAt: '2024-01-01T00:00:00Z' }}
        definitionType="DoR"
        categories={mockCategories}
        onSave={onSaveMock}
        onCancel={onCancelMock}
      />
    );

    const input = screen.getByPlaceholderText('Enter new DoR criterion...');
    fireEvent.change(input, { target: { value: 'New test item' } });

    const addButton = screen.getByRole('button', { name: 'Add new item' });
    fireEvent.click(addButton);

    expect(screen.getByDisplayValue('New test item')).toBeInTheDocument();
  });

  it('should remove an item', () => {
    render(
      <DefinitionEditor
        definition={{ items: mockItems, version: 1, updatedAt: '2024-01-01T00:00:00Z' }}
        definitionType="DoR"
        categories={mockCategories}
        onSave={onSaveMock}
        onCancel={onCancelMock}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
    fireEvent.click(removeButtons[0]!);

    expect(screen.queryByDisplayValue('Test item 1')).not.toBeInTheDocument();
  });

  it('should toggle item active state', () => {
    render(
      <DefinitionEditor
        definition={{ items: [mockItems[0]!], version: 1, updatedAt: '2024-01-01T00:00:00Z' }}
        definitionType="DoR"
        categories={mockCategories}
        onSave={onSaveMock}
        onCancel={onCancelMock}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Deactivate item' });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: 'Activate item' })).toBeInTheDocument();
  });

  it('should call onSave when save button clicked', async () => {
    onSaveMock.mockResolvedValue(undefined);
    render(
      <DefinitionEditor
        definition={{ items: mockItems, version: 1, updatedAt: '2024-01-01T00:00:00Z' }}
        definitionType="DoR"
        categories={mockCategories}
        onSave={onSaveMock}
        onCancel={onCancelMock}
      />
    );

    // Make a change to enable save button
    const input = screen.getByDisplayValue('Test item 1');
    fireEvent.change(input, { target: { value: 'Updated test item' } });

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveButton);

    expect(onSaveMock).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button clicked and no changes', () => {
    render(
      <DefinitionEditor
        definition={{ items: mockItems, version: 1, updatedAt: '2024-01-01T00:00:00Z' }}
        definitionType="DoR"
        categories={mockCategories}
        onSave={onSaveMock}
        onCancel={onCancelMock}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(onCancelMock).toHaveBeenCalled();
  });

  it('should show cancel dialog when cancel button clicked with changes', () => {
    render(
      <DefinitionEditor
        definition={{ items: mockItems, version: 1, updatedAt: '2024-01-01T00:00:00Z' }}
        definitionType="DoR"
        categories={mockCategories}
        onSave={onSaveMock}
        onCancel={onCancelMock}
      />
    );

    // Make a change
    const input = screen.getByDisplayValue('Test item 1');
    fireEvent.change(input, { target: { value: 'Updated test item' } });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(screen.getByText('Discard Changes?')).toBeInTheDocument();
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

import { renderWithProviders, initTestI18n } from '../../../test-utils';
import { ItemStatus } from '../../../types';
import type { FilterState } from '../types/backlog.types';

import { BacklogFilterBar } from './BacklogFilterBar';

const defaultFilters: FilterState = {
  status: [ItemStatus.NEW, ItemStatus.REFINED, ItemStatus.READY],
  search: '',
};

describe('BacklogFilterBar', () => {
  const mockOnFiltersChange = vi.fn();

  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      renderWithProviders(
        <BacklogFilterBar filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
    });

    it('should render status filter chips', () => {
      renderWithProviders(
        <BacklogFilterBar filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^new$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^refined$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^ready$/i })).toBeInTheDocument();
    });

    it('should show active state for selected status chips', () => {
      renderWithProviders(
        <BacklogFilterBar filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const newChip = screen.getByRole('button', { name: /^new$/i });
      expect(newChip.className).toMatch(/active/);
    });

    it('should not show clear button when search is empty', () => {
      renderWithProviders(
        <BacklogFilterBar filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });

    it('should show clear button when search has value', () => {
      const filtersWithSearch: FilterState = {
        ...defaultFilters,
        search: 'test search',
      };

      renderWithProviders(
        <BacklogFilterBar filters={filtersWithSearch} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search value on input', async () => {
      renderWithProviders(
        <BacklogFilterBar filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'Feature A');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should clear search when clicking clear button', async () => {
      const filtersWithSearch: FilterState = {
        ...defaultFilters,
        search: 'test search',
      };

      renderWithProviders(
        <BacklogFilterBar filters={filtersWithSearch} onFiltersChange={mockOnFiltersChange} />
      );

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await userEvent.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithSearch,
        search: '',
      });
    });
  });

  describe('Status Filtering', () => {
    it('should toggle status chip on click', async () => {
      renderWithProviders(
        <BacklogFilterBar filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const newStatusChip = screen.getByRole('button', { name: /^new$/i });
      await userEvent.click(newStatusChip);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        status: [ItemStatus.REFINED, ItemStatus.READY],
      });
    });

    it('should add status when clicking inactive chip', async () => {
      const filtersWithoutNew: FilterState = {
        ...defaultFilters,
        status: [ItemStatus.REFINED, ItemStatus.READY],
      };

      renderWithProviders(
        <BacklogFilterBar filters={filtersWithoutNew} onFiltersChange={mockOnFiltersChange} />
      );

      const newStatusChip = screen.getByRole('button', { name: /^new$/i });
      await userEvent.click(newStatusChip);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithoutNew,
        status: [ItemStatus.REFINED, ItemStatus.READY, ItemStatus.NEW],
      });
    });

    it('should clear all status filters when clicking ALL', async () => {
      renderWithProviders(
        <BacklogFilterBar filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const allChip = screen.getByRole('button', { name: /all/i });
      await userEvent.click(allChip);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        status: [],
      });
    });
  });
});

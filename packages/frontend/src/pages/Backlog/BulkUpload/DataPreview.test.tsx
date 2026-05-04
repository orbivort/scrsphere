import { screen, render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { DataPreview } from './DataPreview';
import { MoSCoWPriority } from '../../../types';
import type { BulkUploadItem } from './bulkUploadUtils';

describe('DataPreview', () => {
  describe('Empty State', () => {
    it('should render empty state when no items', () => {
      render(<DataPreview items={[]} />);

      expect(screen.getByText('No data to preview')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    const mockItems: BulkUploadItem[] = [
      {
        _rowNumber: 2,
        title: 'Feature A',
        description: 'Description A',
        storyPoints: 8,
        businessValue: 13,
        priority: MoSCoWPriority.MUST_HAVE,
        labels: ['frontend', 'backend'],
        _isValid: true,
        _errors: [],
      },
      {
        _rowNumber: 3,
        title: 'Feature B',
        storyPoints: 5,
        businessValue: 8,
        priority: MoSCoWPriority.SHOULD_HAVE,
        labels: ['api'],
        _isValid: true,
        _errors: [],
      },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render preview title', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('Data Preview')).toBeInTheDocument();
    });

    it('should render valid count', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('2 valid')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('#')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Points')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Labels')).toBeInTheDocument();
      expect(screen.getByText('Issues')).toBeInTheDocument();
    });

    it('should render item titles', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('Feature A')).toBeInTheDocument();
      expect(screen.getByText('Feature B')).toBeInTheDocument();
    });

    it('should render row numbers', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render story points', () => {
      render(<DataPreview items={mockItems} />);

      const pointsCells = screen.getAllByText('8');
      expect(pointsCells.length).toBeGreaterThan(0);
    });

    it('should render business value', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('13')).toBeInTheDocument();
    });

    it('should render priority badges', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('Must')).toBeInTheDocument();
      expect(screen.getByText('Should')).toBeInTheDocument();
    });

    it('should render labels', () => {
      render(<DataPreview items={mockItems} />);

      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
    });

    it('should render OK for valid items', () => {
      render(<DataPreview items={mockItems} />);

      const okElements = screen.getAllByText('OK');
      expect(okElements.length).toBe(2);
    });
  });

  describe('Invalid Items', () => {
    const invalidItems: BulkUploadItem[] = [
      {
        _rowNumber: 2,
        title: '',
        _isValid: false,
        _errors: [{ row: 2, field: 'title', message: 'Title is required' }],
      },
    ];

    it('should render invalid count', () => {
      render(<DataPreview items={invalidItems} />);

      expect(screen.getByText('1 with errors')).toBeInTheDocument();
    });

    it('should render missing title indicator', () => {
      render(<DataPreview items={invalidItems} />);

      expect(screen.getByText('Missing title')).toBeInTheDocument();
    });

    it('should render error messages', () => {
      render(<DataPreview items={invalidItems} />);

      expect(screen.getByText(/title: Title is required/)).toBeInTheDocument();
    });
  });

  describe('Labels Display', () => {
    it('should limit labels to 2 with overflow indicator', () => {
      const itemsWithManyLabels: BulkUploadItem[] = [
        {
          _rowNumber: 2,
          title: 'Test',
          labels: ['label1', 'label2', 'label3', 'label4'],
          _isValid: true,
          _errors: [],
        },
      ];

      render(<DataPreview items={itemsWithManyLabels} />);

      expect(screen.getByText('label1')).toBeInTheDocument();
      expect(screen.getByText('label2')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should render dash for no labels', () => {
      const itemsNoLabels: BulkUploadItem[] = [
        {
          _rowNumber: 2,
          title: 'Test',
          labels: [],
          _isValid: true,
          _errors: [],
        },
      ];

      render(<DataPreview items={itemsNoLabels} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Priority Display', () => {
    it('should render Could Have priority', () => {
      const items: BulkUploadItem[] = [
        {
          _rowNumber: 2,
          title: 'Test',
          priority: MoSCoWPriority.COULD_HAVE,
          _isValid: true,
          _errors: [],
        },
      ];

      render(<DataPreview items={items} />);

      expect(screen.getByText('Could')).toBeInTheDocument();
    });

    it("should render Won't Have priority", () => {
      const items: BulkUploadItem[] = [
        {
          _rowNumber: 2,
          title: 'Test',
          priority: MoSCoWPriority.WONT_HAVE,
          _isValid: true,
          _errors: [],
        },
      ];

      render(<DataPreview items={items} />);

      expect(screen.getByText("Won't")).toBeInTheDocument();
    });

    it('should render dash for no priority', () => {
      const items: BulkUploadItem[] = [
        {
          _rowNumber: 2,
          title: 'Test',
          _isValid: true,
          _errors: [],
        },
      ];

      render(<DataPreview items={items} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Missing Data', () => {
    it('should render dash for missing story points', () => {
      const items: BulkUploadItem[] = [
        {
          _rowNumber: 2,
          title: 'Test',
          storyPoints: undefined,
          _isValid: true,
          _errors: [],
        },
      ];

      render(<DataPreview items={items} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('should render dash for missing business value', () => {
      const items: BulkUploadItem[] = [
        {
          _rowNumber: 2,
          title: 'Test',
          businessValue: undefined,
          _isValid: true,
          _errors: [],
        },
      ];

      render(<DataPreview items={items} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });
});

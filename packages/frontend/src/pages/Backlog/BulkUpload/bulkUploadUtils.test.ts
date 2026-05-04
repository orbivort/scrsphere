import { describe, it, expect, vi } from 'vitest';

import {
  parseCSV,
  validateItem,
  validateItems,
  getValidItems,
  getInvalidItems,
  getAllErrors,
  generateCSVTemplate,
  formatFileSize,
  isValidFileType,
  type BulkUploadItem,
} from './bulkUploadUtils';
import { MoSCoWPriority, type ProductBacklogItem } from '../../../types';

vi.mock('../../../services', () => ({
  apiService: {},
}));

describe('bulkUploadUtils', () => {
  describe('parseCSV', () => {
    describe('Valid CSV Parsing', () => {
      it('should parse basic CSV with headers', () => {
        const csv = 'title,description\nTest Item,Test Description';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Test Item');
        expect(result.items[0]?.description).toBe('Test Description');
      });

      it('should parse CSV with all fields', () => {
        const csv = `title,description,storyPoints,businessValue,priority,labels,acceptanceCriteria
Test Item,Test Description,8,13,Must Have,"frontend,backend",Test criteria`;
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Test Item');
        expect(result.items[0]?.storyPoints).toBe(8);
        expect(result.items[0]?.businessValue).toBe(13);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[0]?.labels).toEqual(['frontend', 'backend']);
      });

      it('should handle CRLF line endings', () => {
        const csv = 'title,description\r\nTest Item,Test Description';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
      });

      it('should handle quoted fields', () => {
        const csv = 'title,description\n"Test, Item","Test ""Description"""\n';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items[0]?.title).toBe('Test, Item');
        expect(result.items[0]?.description).toBe('Test "Description"');
      });

      it('should handle various header names', () => {
        const csv = 'name,desc,points,value,moscow,tags,criteria\nTest,Desc,5,8,Must,tag1,AC';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items[0]?.title).toBe('Test');
        expect(result.items[0]?.description).toBe('Desc');
        expect(result.items[0]?.storyPoints).toBe(5);
        expect(result.items[0]?.businessValue).toBe(8);
      });
    });

    describe('Priority Parsing', () => {
      it('should parse Must Have priority variations', () => {
        const variations = ['Must Have', 'must have', 'Must', 'must', 'M', 'm'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        });
      });

      it('should parse Should Have priority variations', () => {
        const variations = ['Should Have', 'should have', 'Should', 'should', 'S', 's'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
        });
      });

      it('should parse Could Have priority variations', () => {
        const variations = ['Could Have', 'could have', 'Could', 'could', 'C', 'c'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
        });
      });

      it("should parse Won't Have priority variations", () => {
        const variations = ["Won't Have", "won't have", 'Wont', 'wont', 'W', 'w'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
        });
      });
    });

    describe('Error Handling', () => {
      it('should return error for empty file', () => {
        const result = parseCSV('');

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.message).toBe('File is empty');
      });

      it('should return error for missing title column', () => {
        const csv = 'description,priority\nTest Description,Must Have';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.message).toContain('Missing required column');
      });

      it('should skip empty lines', () => {
        const csv = 'title\nTest 1\n\nTest 2\n';
        const result = parseCSV(csv);

        expect(result.items).toHaveLength(2);
      });
    });

    describe('Row Numbers', () => {
      it('should assign correct row numbers', () => {
        const csv = 'title\nItem 1\nItem 2\nItem 3';
        const result = parseCSV(csv);

        expect(result.items[0]?._rowNumber).toBe(2);
        expect(result.items[1]?._rowNumber).toBe(3);
        expect(result.items[2]?._rowNumber).toBe(4);
      });
    });
  });

  describe('validateItem', () => {
    const existingItems: ProductBacklogItem[] = [
      {
        id: 'existing-1',
        title: 'Existing Item',
        status: 'NEW',
        priority: MoSCoWPriority.MUST_HAVE,
        teamId: 'team-1',
        goalId: 'goal-1',
        labels: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as ProductBacklogItem,
    ];

    it('should return error for missing title', () => {
      const item: BulkUploadItem = { _rowNumber: 1 };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should return error for empty title', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: '   ' };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should return error for title exceeding 200 characters', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'a'.repeat(201) };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.message.includes('200 characters'))).toBe(true);
    });

    it('should return error for duplicate title', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'Existing Item' };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.message.includes('Duplicate title'))).toBe(true);
    });

    it('should return error for story points out of range', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'Test', storyPoints: 0 };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'storyPoints')).toBe(true);
    });

    it('should return error for business value out of range', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'Test', businessValue: 101 };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'businessValue')).toBe(true);
    });

    it('should return no errors for valid item', () => {
      const item: BulkUploadItem = {
        _rowNumber: 1,
        title: 'Valid Item',
        storyPoints: 8,
        businessValue: 13,
        priority: MoSCoWPriority.MUST_HAVE,
      };
      const errors = validateItem(item, existingItems);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateItems', () => {
    it('should validate all items and set isValid flag', () => {
      const items: BulkUploadItem[] = [{ _rowNumber: 1, title: 'Valid Item' }, { _rowNumber: 2 }];

      const result = validateItems(items, []);

      expect(result[0]?._isValid).toBe(true);
      expect(result[1]?._isValid).toBe(false);
    });

    it('should detect duplicates within file', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, title: 'Duplicate' },
        { _rowNumber: 2, title: 'Duplicate' },
      ];

      const result = validateItems(items, []);

      expect(result[1]?._errors?.some((e) => e.message.includes('Duplicate'))).toBe(true);
    });
  });

  describe('getValidItems', () => {
    it('should return only valid items', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, title: 'Valid', _isValid: true },
        { _rowNumber: 2, _isValid: false },
        { _rowNumber: 3, title: 'Valid 2', _isValid: true },
      ];

      const valid = getValidItems(items);

      expect(valid).toHaveLength(2);
      expect(valid.every((i) => i._isValid)).toBe(true);
    });
  });

  describe('getInvalidItems', () => {
    it('should return only invalid items', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, title: 'Valid', _isValid: true },
        { _rowNumber: 2, _isValid: false },
      ];

      const invalid = getInvalidItems(items);

      expect(invalid).toHaveLength(1);
      expect(invalid.every((i) => !i._isValid)).toBe(true);
    });
  });

  describe('getAllErrors', () => {
    it('should collect all errors from all items', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, _errors: [{ row: 1, field: 'title', message: 'Error 1' }] },
        { _rowNumber: 2, _errors: [{ row: 2, field: 'title', message: 'Error 2' }] },
      ];

      const errors = getAllErrors(items);

      expect(errors).toHaveLength(2);
    });
  });

  describe('generateCSVTemplate', () => {
    it('should generate valid CSV template', () => {
      const template = generateCSVTemplate();

      expect(template).toContain('title');
      expect(template).toContain('description');
      expect(template).toContain('storyPoints');
      expect(template).toContain('businessValue');
      expect(template).toContain('priority');
      expect(template).toContain('labels');
      expect(template).toContain('acceptanceCriteria');
    });

    it('should include example rows', () => {
      const template = generateCSVTemplate();

      expect(template).toContain('User Authentication');
      expect(template).toContain('Must Have');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
  });

  describe('isValidFileType', () => {
    it('should accept CSV files by MIME type', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      expect(isValidFileType(file)).toBe(true);
    });

    it('should accept CSV files by extension', () => {
      const file = new File([''], 'test.CSV', { type: '' });
      expect(isValidFileType(file)).toBe(true);
    });

    it('should reject non-CSV files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isValidFileType(file)).toBe(false);
    });
  });
});

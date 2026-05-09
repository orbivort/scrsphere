import { MoSCoWPriority, type ProductBacklogItem } from '../../../types';

export interface BulkUploadItem {
  title?: string;
  description?: string;
  storyPoints?: number;
  businessValue?: number;
  priority?: MoSCoWPriority;
  labels?: string[];
  acceptanceCriteria?: string;
  _rowNumber: number;
  _isValid?: boolean;
  _errors?: ValidationError[];
  _isDuplicate?: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: ValidationError[];
  createdItems: ProductBacklogItem[];
}

export interface ParsedData {
  items: BulkUploadItem[];
  errors: ValidationError[];
  totalRows: number;
}

const HEADER_MAPPINGS: Record<string, string> = {
  title: 'title',
  name: 'title',
  item: 'title',
  description: 'description',
  desc: 'description',
  storypoints: 'storyPoints',
  points: 'storyPoints',
  estimate: 'storyPoints',
  sp: 'storyPoints',
  businessvalue: 'businessValue',
  value: 'businessValue',
  bv: 'businessValue',
  priority: 'priority',
  moscow: 'priority',
  labels: 'labels',
  tags: 'labels',
  acceptancecriteria: 'acceptanceCriteria',
  criteria: 'acceptanceCriteria',
  ac: 'acceptanceCriteria',
};

const PRIORITY_MAPPINGS: Record<string, MoSCoWPriority> = {
  'must have': MoSCoWPriority.MUST_HAVE,
  must: MoSCoWPriority.MUST_HAVE,
  m: MoSCoWPriority.MUST_HAVE,
  'should have': MoSCoWPriority.SHOULD_HAVE,
  should: MoSCoWPriority.SHOULD_HAVE,
  s: MoSCoWPriority.SHOULD_HAVE,
  'could have': MoSCoWPriority.COULD_HAVE,
  could: MoSCoWPriority.COULD_HAVE,
  c: MoSCoWPriority.COULD_HAVE,
  "won't have": MoSCoWPriority.WONT_HAVE,
  wont: MoSCoWPriority.WONT_HAVE,
  w: MoSCoWPriority.WONT_HAVE,
  'will not have': MoSCoWPriority.WONT_HAVE,
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\s_-]/g, '');
}

function mapHeader(header: string): string | null {
  const normalized = normalizeHeader(header);
  return HEADER_MAPPINGS[normalized] ?? null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

function detectLineEnding(content: string): string {
  const crlfIndex = content.indexOf('\r\n');
  if (crlfIndex !== -1) return '\r\n';
  const lfIndex = content.indexOf('\n');
  if (lfIndex !== -1) return '\n';
  return '\n';
}

export function parseCSV(content: string): ParsedData {
  const errors: ValidationError[] = [];
  const items: BulkUploadItem[] = [];

  const lineEnding = detectLineEnding(content);
  const lines = content.split(lineEnding).filter((line) => line.trim());

  if (lines.length === 0) {
    errors.push({ row: 0, field: 'file', message: 'File is empty' });
    return { items, errors, totalRows: 0 };
  }

  const headerLine = lines[0];
  if (!headerLine) {
    errors.push({ row: 0, field: 'file', message: 'File has no header line' });
    return { items, errors, totalRows: 0 };
  }
  const rawHeaders = parseCSVLine(headerLine);
  const headerMappings: Record<number, string> = {};

  rawHeaders.forEach((header, index) => {
    const mappedField = mapHeader(header);
    if (mappedField) {
      headerMappings[index] = mappedField;
    }
  });

  const hasTitle = Object.values(headerMappings).includes('title');
  if (!hasTitle) {
    errors.push({
      row: 1,
      field: 'header',
      message: 'Missing required column: "title". Please ensure your CSV has a "title" column.',
    });
    return { items, errors, totalRows: 0 };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rowNumber = i + 1;

    if (!line?.trim()) continue;

    const values = parseCSVLine(line);
    const item: BulkUploadItem = {
      _rowNumber: rowNumber,
      _isValid: true,
      _errors: [],
    };

    values.forEach((value, index) => {
      const field = headerMappings[index];
      if (!field || !value) return;

      const trimmedValue = value.trim();
      if (!trimmedValue) return;

      switch (field) {
        case 'title':
          item.title = trimmedValue;
          break;
        case 'description':
          item.description = trimmedValue;
          break;
        case 'storyPoints': {
          const sp = parseInt(trimmedValue, 10);
          if (!isNaN(sp)) {
            item.storyPoints = sp;
          }
          break;
        }
        case 'businessValue': {
          const bv = parseInt(trimmedValue, 10);
          if (!isNaN(bv)) {
            item.businessValue = bv;
          }
          break;
        }
        case 'priority': {
          const normalizedPriority = trimmedValue.toLowerCase();
          const priority = PRIORITY_MAPPINGS[normalizedPriority];
          if (priority) {
            item.priority = priority;
          }
          break;
        }
        case 'labels':
          item.labels = trimmedValue
            .split(/[;,]/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          break;
        case 'acceptanceCriteria':
          item.acceptanceCriteria = trimmedValue;
          break;
      }
    });

    items.push(item);
  }

  return { items, errors, totalRows: lines.length - 1 };
}

export function validateItem(
  item: BulkUploadItem,
  existingItems: ProductBacklogItem[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!item.title || item.title.trim().length === 0) {
    errors.push({
      row: item._rowNumber,
      field: 'title',
      message: 'Title is required',
      value: item.title,
    });
  } else if (item.title.length > 200) {
    errors.push({
      row: item._rowNumber,
      field: 'title',
      message: 'Title must be less than 200 characters',
      value: item.title,
    });
  }

  if (item.storyPoints !== undefined) {
    if (isNaN(item.storyPoints)) {
      errors.push({
        row: item._rowNumber,
        field: 'storyPoints',
        message: 'Story points must be a number',
        value: item.storyPoints,
      });
    } else if (item.storyPoints < 1 || item.storyPoints > 100) {
      errors.push({
        row: item._rowNumber,
        field: 'storyPoints',
        message: 'Story points must be between 1 and 100',
        value: item.storyPoints,
      });
    }
  }

  if (item.businessValue !== undefined) {
    if (isNaN(item.businessValue)) {
      errors.push({
        row: item._rowNumber,
        field: 'businessValue',
        message: 'Business value must be a number',
        value: item.businessValue,
      });
    } else if (item.businessValue < 1 || item.businessValue > 100) {
      errors.push({
        row: item._rowNumber,
        field: 'businessValue',
        message: 'Business value must be between 1 and 100',
        value: item.businessValue,
      });
    }
  }

  if (item.priority && !Object.values(MoSCoWPriority).includes(item.priority)) {
    errors.push({
      row: item._rowNumber,
      field: 'priority',
      message: "Invalid priority. Must be one of: Must Have, Should Have, Could Have, Won't Have",
      value: item.priority,
    });
  }

  if (item.title?.trim()) {
    const itemTitle = item.title.toLowerCase().trim();
    const duplicate = existingItems.find(
      (existing) => existing.title.toLowerCase().trim() === itemTitle
    );
    if (duplicate) {
      errors.push({
        row: item._rowNumber,
        field: 'title',
        message: `Duplicate title: An item with this title already exists (ID: ${duplicate.id.slice(-4)})`,
        value: item.title,
      });
    }
  }

  return errors;
}

export function validateItems(
  items: BulkUploadItem[],
  existingItems: ProductBacklogItem[]
): BulkUploadItem[] {
  const seenTitles = new Set<string>();

  return items.map((item) => {
    const validationErrors = validateItem(item, existingItems);

    const normalizedTitle = item.title?.toLowerCase().trim();
    if (normalizedTitle && seenTitles.has(normalizedTitle)) {
      validationErrors.push({
        row: item._rowNumber,
        field: 'title',
        message: 'Duplicate title within the uploaded file',
        value: item.title,
      });
    } else if (normalizedTitle) {
      seenTitles.add(normalizedTitle);
    }

    return {
      ...item,
      _isValid: validationErrors.length === 0,
      _errors: validationErrors,
    };
  });
}

export function getValidItems(items: BulkUploadItem[]): BulkUploadItem[] {
  return items.filter((item) => item._isValid);
}

export function getInvalidItems(items: BulkUploadItem[]): BulkUploadItem[] {
  return items.filter((item) => !item._isValid);
}

export function getAllErrors(items: BulkUploadItem[]): ValidationError[] {
  return items.flatMap((item) => item._errors ?? []);
}

export function generateCSVTemplate(): string {
  const headers = [
    'title',
    'description',
    'storyPoints',
    'businessValue',
    'priority',
    'labels',
    'acceptanceCriteria',
  ];

  const exampleRows = [
    [
      'User Authentication',
      'Implement OAuth2 login with Google and GitHub providers',
      '8',
      '13',
      'Must Have',
      'auth,security,backend',
      'User can log in with Google; User can log in with GitHub; Session persists for 30 days',
    ],
    [
      'Dashboard Analytics Widget',
      'Add real-time analytics widget to main dashboard',
      '5',
      '5',
      'Should Have',
      'dashboard,analytics',
      'Widget displays real-time data; Widget refreshes every 30 seconds',
    ],
    [
      'Dark Mode Support',
      'Implement dark mode theme across the application',
      '3',
      '3',
      'Could Have',
      'ui,theme',
      'User can toggle dark mode; Preference is saved',
    ],
  ];

  const csvLines = [
    headers.join(','),
    ...exampleRows.map((row) =>
      row
        .map((cell) =>
          cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell
        )
        .join(',')
    ),
  ];

  return csvLines.join('\n');
}

export function downloadTemplate(): void {
  const template = generateCSVTemplate();
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'backlog-import-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function isValidFileType(file: File): boolean {
  const validTypes = ['text/csv', 'application/vnd.ms-excel'];
  const validExtensions = ['.csv'];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return validTypes.includes(file.type) || validExtensions.includes(extension);
}

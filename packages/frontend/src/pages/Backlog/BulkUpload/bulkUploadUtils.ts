import i18next from 'i18next';
import type { Locale } from '@scrumooth/shared';

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
  // English headers
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

  // German headers
  titel: 'title',
  beschreibung: 'description',
  storypunkte: 'storyPoints',
  businesswert: 'businessValue',
  priorität: 'priority',
  akzeptanzkriterien: 'acceptanceCriteria',

  // Spanish headers
  título: 'title',
  descripción: 'description',
  puntosdehistoria: 'storyPoints',
  valordenegocio: 'businessValue',
  prioridad: 'priority',
  etiquetas: 'labels',
  criteriosdeaceptación: 'acceptanceCriteria',

  // French headers
  titre: 'title',
  pointsdhistoire: 'storyPoints',
  valeurdaffaires: 'businessValue',
  valeurmétier: 'businessValue',
  priorité: 'priority',
  étiquettes: 'labels',
  critèresdacceptation: 'acceptanceCriteria',

  // Italian headers
  titolo: 'title',
  descrizione: 'description',
  puntistoria: 'storyPoints',
  valorebusiness: 'businessValue',
  priorità: 'priority',
  criteridiaccettazione: 'acceptanceCriteria',
};

const PRIORITY_MAPPINGS: Record<string, MoSCoWPriority> = {
  // English
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

  // German
  'muss haben': MoSCoWPriority.MUST_HAVE,
  musshaben: MoSCoWPriority.MUST_HAVE,
  muss: MoSCoWPriority.MUST_HAVE,
  'sollte haben': MoSCoWPriority.SHOULD_HAVE,
  solltehaben: MoSCoWPriority.SHOULD_HAVE,
  sollte: MoSCoWPriority.SHOULD_HAVE,
  'könnte haben': MoSCoWPriority.COULD_HAVE,
  könnte: MoSCoWPriority.COULD_HAVE,
  könntehaben: MoSCoWPriority.COULD_HAVE,
  'wird nicht haben': MoSCoWPriority.WONT_HAVE,
  wirdnichthaben: MoSCoWPriority.WONT_HAVE,
  'wird nicht': MoSCoWPriority.WONT_HAVE,
  wird: MoSCoWPriority.WONT_HAVE,

  // Spanish
  'debe tener': MoSCoWPriority.MUST_HAVE,
  debetener: MoSCoWPriority.MUST_HAVE,
  debe: MoSCoWPriority.MUST_HAVE,
  'debería tener': MoSCoWPriority.SHOULD_HAVE,
  debería: MoSCoWPriority.SHOULD_HAVE,
  deberíatener: MoSCoWPriority.SHOULD_HAVE,
  'podría tener': MoSCoWPriority.COULD_HAVE,
  podría: MoSCoWPriority.COULD_HAVE,
  podríatener: MoSCoWPriority.COULD_HAVE,
  'no tendrá': MoSCoWPriority.WONT_HAVE,
  notendrá: MoSCoWPriority.WONT_HAVE,

  // French
  'doit avoir': MoSCoWPriority.MUST_HAVE,
  doitavoir: MoSCoWPriority.MUST_HAVE,
  doit: MoSCoWPriority.MUST_HAVE,
  'devrait avoir': MoSCoWPriority.SHOULD_HAVE,
  devraitavoir: MoSCoWPriority.SHOULD_HAVE,
  devrait: MoSCoWPriority.SHOULD_HAVE,
  'pourrait avoir': MoSCoWPriority.COULD_HAVE,
  pourraitavoir: MoSCoWPriority.COULD_HAVE,
  pourrait: MoSCoWPriority.COULD_HAVE,
  "n'aura pas": MoSCoWPriority.WONT_HAVE,
  naurapas: MoSCoWPriority.WONT_HAVE,

  // Italian
  'deve avere': MoSCoWPriority.MUST_HAVE,
  deveavere: MoSCoWPriority.MUST_HAVE,
  deve: MoSCoWPriority.MUST_HAVE,
  'dovrebbe avere': MoSCoWPriority.SHOULD_HAVE,
  dovrebbeavere: MoSCoWPriority.SHOULD_HAVE,
  dovrebbe: MoSCoWPriority.SHOULD_HAVE,
  'potrebbe avere': MoSCoWPriority.COULD_HAVE,
  potrebbeavere: MoSCoWPriority.COULD_HAVE,
  potrebbe: MoSCoWPriority.COULD_HAVE,
  'non avrà': MoSCoWPriority.WONT_HAVE,
  nonavrà: MoSCoWPriority.WONT_HAVE,
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

interface TemplateHeaders {
  title: string;
  description: string;
  storyPoints: string;
  businessValue: string;
  priority: string;
  labels: string;
  acceptanceCriteria: string;
}

interface TemplateExample {
  title: string;
  description: string;
  storyPoints: number;
  businessValue: number;
  priority: string;
  labels: string;
  acceptanceCriteria: string;
}

/**
 * Escapes a CSV cell value by wrapping in quotes if it contains commas or quotes.
 * Existing quotes are doubled.
 */
function escapeCSVCell(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generates a localized CSV template for backlog item import.
 * @param locale - The locale to use for translations (e.g., 'en', 'de', 'es', 'fr', 'it')
 * @returns CSV string with localized headers and example rows
 */
export function generateCSVTemplate(locale: Locale): string {
  const t = i18next.getFixedT(locale, 'backlog');

  // Get localized headers as an object
  const headersObj = t('bulkUpload.template.headers', { returnObjects: true }) as TemplateHeaders;
  const headers = [
    headersObj.title,
    headersObj.description,
    headersObj.storyPoints,
    headersObj.businessValue,
    headersObj.priority,
    headersObj.labels,
    headersObj.acceptanceCriteria,
  ];

  // Get localized examples as an array of objects
  const examples = t('bulkUpload.template.examples', { returnObjects: true }) as TemplateExample[];

  // Format example rows with proper CSV escaping
  const exampleRows = examples.map((example) => [
    escapeCSVCell(example.title),
    escapeCSVCell(example.description),
    String(example.storyPoints),
    String(example.businessValue),
    escapeCSVCell(example.priority),
    escapeCSVCell(example.labels),
    escapeCSVCell(example.acceptanceCriteria),
  ]);

  const csvLines = [headers.join(','), ...exampleRows.map((row) => row.join(','))];

  return csvLines.join('\n');
}

/**
 * Downloads a localized CSV template file for backlog item import.
 * @param locale - The locale to use for translations and filename
 */
export function downloadTemplate(locale: Locale): void {
  const t = i18next.getFixedT(locale, 'backlog');
  const template = generateCSVTemplate(locale);
  const filename = t('bulkUpload.template.filename');

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
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

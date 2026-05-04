import { type ItemStatus, type MoSCoWPriority } from '../../../types';

/**
 * Form data structure for creating/editing backlog items
 */
export interface ItemFormData {
  title: string;
  description: string;
  estimate: number | undefined;
  moscowPriority: MoSCoWPriority;
  businessValue: number | undefined;
  labels: string;
  acceptanceCriteria: string;
  status: ItemStatus;
}

/**
 * Form validation errors
 */
export interface FormErrors {
  title?: string;
  estimate?: string;
  businessValue?: string;
  teamId?: string;
  moscowPriority?: string;
  description?: string;
  labels?: string;
  acceptanceCriteria?: string;
  status?: string;
}

/**
 * Filter state for backlog items
 */
export interface FilterState {
  status: string[];
  search: string;
}

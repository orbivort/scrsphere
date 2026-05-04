import { z } from 'zod';

const emailValidator = z.string().email('Please enter a valid email address').optional();

const dateValidator = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid date format',
  })
  .optional();

const retroItemCategoryEnum = z.enum(['WENT_WELL', 'DIDNT_GO_WELL', 'IMPROVEMENT'], {
  error: 'Invalid category. Must be one of: WENT_WELL, DIDNT_GO_WELL, IMPROVEMENT',
});

const actionItemStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
  error: 'Invalid status. Must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED',
});

const retrospectiveStatusEnum = z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED'], {
  error: 'Invalid status. Must be one of: DRAFT, IN_PROGRESS, COMPLETED',
});

const attendeeRoleEnum = z.enum(['product_owner', 'scrum_master', 'developer', 'stakeholder'], {
  error: 'Invalid role. Must be one of: product_owner, scrum_master, developer, stakeholder',
});

export const createRetrospectiveSchema = z.object({
  sprintId: z.string().min(1, 'sprintId is required'),
  teamId: z.string().min(1, 'teamId is required'),
  facilitatorId: z.string().min(1, 'facilitatorId is required'),
  retroDate: dateValidator,
});

export const addItemSchema = z.object({
  category: retroItemCategoryEnum,
  content: z
    .string()
    .min(1, 'Content is required and cannot be empty')
    .max(500, 'Content must be 500 characters or less'),
  authorId: z.string().optional(),
  authorName: z.string().optional(),
});

export const updateItemSchema = z.object({
  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(500, 'Content must be 500 characters or less')
    .optional(),
});

export const addActionItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required and cannot be empty')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  ownerId: z.string().min(1, 'Owner ID is required'),
  dueDate: dateValidator,
  status: actionItemStatusEnum.optional(),
});

export const updateActionItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  status: actionItemStatusEnum.optional(),
  dueDate: dateValidator.nullable(),
  addedToSprintBacklog: z.boolean().optional(),
  relatedSprintId: z.string().uuid().nullable().optional(),
});

export const updateRetrospectiveSchema = z
  .object({
    summary: z
      .string()
      .min(10, 'Summary must be at least 10 characters')
      .max(1000, 'Summary must be 1000 characters or less')
      .refine((val: string) => !/<[^>]*>/g.test(val), {
        message: 'HTML tags are not allowed in summary',
      })
      .optional(),
    dodEvolutionNotes: z
      .string()
      .max(2000, 'DoD evolution notes must be 2000 characters or less')
      .refine((val: string) => val.length === 0 || val.length >= 10, {
        message: 'DoD evolution notes must be at least 10 characters if provided',
      })
      .refine((val: string) => !/<[^>]*>/g.test(val), {
        message: 'HTML tags are not allowed in DoD evolution notes',
      })
      .optional(),
    status: retrospectiveStatusEnum.optional(),
  })
  .refine(
    (data) =>
      data.summary !== undefined ||
      data.dodEvolutionNotes !== undefined ||
      data.status !== undefined,
    {
      message: 'At least one field (summary, dodEvolutionNotes, or status) is required',
    }
  );

export const addAttendeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: emailValidator,
  role: attendeeRoleEnum,
  attended: z.boolean().optional().default(true),
});

export const updateAttendeeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  email: emailValidator.nullable(),
  role: attendeeRoleEnum.optional(),
  attended: z.boolean().optional(),
});

export type CreateRetrospectiveInput = z.infer<typeof createRetrospectiveSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type AddActionItemInput = z.infer<typeof addActionItemSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;
export type UpdateRetrospectiveInput = z.infer<typeof updateRetrospectiveSchema>;
export type AddAttendeeInput = z.infer<typeof addAttendeeSchema>;
export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>;

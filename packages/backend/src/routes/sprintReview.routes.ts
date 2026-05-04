import { Router, type Router as RouterType } from 'express';
import * as sprintReviewController from '../controllers/sprintReview.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { z } from 'zod';

const router: RouterType = Router();

router.use(authenticate);

const reviewIdSchema = z.object({
  id: z.string().uuid('Invalid review ID'),
});

const teamQuerySchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  sprintId: z.string().uuid('Invalid sprint ID').optional(),
});

const createReviewSchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
  teamId: z.string().uuid('Invalid team ID'),
  incrementId: z.string().uuid('Invalid increment ID').optional(),
  reviewDate: z.string().transform((val) => new Date(val)),
  summary: z.string().max(2000).optional(),
});

const updateReviewSchema = z.object({
  summary: z.string().max(2000).optional(),
  status: z.enum(['in_progress', 'completed']).optional(),
  reviewDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  attendees: z
    .array(
      z.object({
        name: z.string(),
        email: z.string().email().optional(),
        role: z.string(),
        attended: z.boolean(),
      })
    )
    .optional(),
  feedback: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        authorName: z.string(),
        content: z.string(),
        category: z.enum(['positive', 'negative', 'suggestion', 'question']),
        relatedPbiId: z.string().uuid().nullable().optional(),
        actionRequired: z.boolean().optional(),
        actionTaken: z.boolean().optional(),
        ownerId: z.string().uuid().nullable().optional(),
      })
    )
    .optional(),
  backlogAdjustments: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        action: z.enum(['add', 'modify', 'remove', 'reorder', 'split']),
        description: z.string(),
        reason: z.string(),
        pbiId: z.string().uuid().nullable().optional(),
        implemented: z.boolean().optional(),
        ownerId: z.string().uuid().nullable().optional(),
      })
    )
    .optional(),
});

const addFeedbackSchema = z.object({
  authorName: z.string().min(1, 'Author name is required'),
  content: z.string().min(1, 'Feedback content is required'),
  category: z.enum(['positive', 'negative', 'suggestion', 'question']).default('positive'),
  relatedPbiId: z.string().uuid().nullable().optional(),
  actionRequired: z.boolean().default(false),
  ownerId: z.string().uuid().nullable().optional(),
});

const addAttendeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format').max(255).optional().or(z.literal('')),
  role: z.enum(['product_owner', 'scrum_master', 'developer', 'stakeholder'], {
    error: 'Invalid role selected',
  }),
  attended: z.boolean().default(true),
});

const updateAttendeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  email: z.string().email('Invalid email format').max(255).optional().or(z.literal('')),
  role: z
    .enum(['product_owner', 'scrum_master', 'developer', 'stakeholder'], {
      error: 'Invalid role selected',
    })
    .optional(),
  attended: z.boolean().optional(),
});

router.get('/', validateQuery(teamQuerySchema), sprintReviewController.getSprintReviews);

router.get(
  '/adjustments/pending',
  validateQuery(z.object({ teamId: z.string().uuid('Invalid team ID') })),
  sprintReviewController.getPendingAdjustments
);

router.put(
  '/adjustments/:id/implement',
  validateParams(z.object({ id: z.string().uuid('Invalid adjustment ID') })),
  sprintReviewController.markAdjustmentImplemented
);

router.get(
  '/feedback/pending',
  validateQuery(z.object({ teamId: z.string().uuid('Invalid team ID') })),
  sprintReviewController.getPendingFeedback
);

router.put(
  '/feedback/:id/address',
  validateParams(z.object({ id: z.string().uuid('Invalid feedback ID') })),
  sprintReviewController.markFeedbackAddressed
);

router.get('/:id', validateParams(reviewIdSchema), sprintReviewController.getSprintReviewById);

router.post('/', validateBody(createReviewSchema), sprintReviewController.createSprintReview);

router.put(
  '/:id',
  validateParams(reviewIdSchema),
  validateBody(updateReviewSchema),
  sprintReviewController.updateSprintReview
);

router.post(
  '/:id/feedback',
  validateParams(reviewIdSchema),
  validateBody(addFeedbackSchema),
  sprintReviewController.addStakeholderFeedback
);

router.post(
  '/:reviewId/attendees',
  validateParams(z.object({ reviewId: z.string().uuid('Invalid review ID') })),
  validateBody(addAttendeeSchema),
  sprintReviewController.addAttendee
);

router.put(
  '/attendees/:id',
  validateParams(z.object({ id: z.string().uuid('Invalid attendee ID') })),
  validateBody(updateAttendeeSchema),
  sprintReviewController.updateAttendee
);

router.delete(
  '/attendees/:id',
  validateParams(z.object({ id: z.string().uuid('Invalid attendee ID') })),
  sprintReviewController.deleteAttendee
);

router.delete('/:id', validateParams(reviewIdSchema), sprintReviewController.deleteSprintReview);

export default router;

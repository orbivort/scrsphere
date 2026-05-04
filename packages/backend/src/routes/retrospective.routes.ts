import express, { type Router as RouterType } from 'express';
import authenticate from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  getRetrospectives,
  getRetrospectiveById,
  getRetrospectiveBySprintId,
  createRetrospective,
  addItem,
  voteItem,
  unvoteItem,
  updateItem,
  deleteItem,
  updateRetrospective,
  addActionItem,
  updateActionItem,
  deleteActionItem,
  getPendingActionItems,
  addRetroAttendee,
  updateRetroAttendee,
  deleteRetroAttendee,
} from '../controllers/retrospective.controller';
import {
  createRetrospectiveSchema,
  addItemSchema,
  updateItemSchema,
  addActionItemSchema,
  updateActionItemSchema,
  updateRetrospectiveSchema,
  addAttendeeSchema,
  updateAttendeeSchema,
} from '../validations/retrospective.validation';

const router: RouterType = express.Router();

router.get('/team/:teamId', authenticate, getRetrospectives);
router.get('/team/:teamId/pending-action-items', authenticate, getPendingActionItems);
router.get('/:id', authenticate, getRetrospectiveById);
router.get('/sprint/:sprintId', authenticate, getRetrospectiveBySprintId);
router.post('/', authenticate, validateBody(createRetrospectiveSchema), createRetrospective);

router.post('/:retroId/items', authenticate, validateBody(addItemSchema), addItem);
router.post('/:retroId/items/:itemId/vote', authenticate, voteItem);
router.delete('/:retroId/items/:itemId/vote', authenticate, unvoteItem);
router.put('/:retroId/items/:itemId', authenticate, validateBody(updateItemSchema), updateItem);
router.delete('/:retroId/items/:itemId', authenticate, deleteItem);

router.put('/:id', authenticate, validateBody(updateRetrospectiveSchema), updateRetrospective);

router.post(
  '/:retroId/action-items',
  authenticate,
  validateBody(addActionItemSchema),
  addActionItem
);
router.put(
  '/:retroId/action-items/:actionItemId',
  authenticate,
  validateBody(updateActionItemSchema),
  updateActionItem
);
router.delete('/:retroId/action-items/:actionItemId', authenticate, deleteActionItem);

router.post('/:retroId/attendees', authenticate, validateBody(addAttendeeSchema), addRetroAttendee);
router.put(
  '/attendees/:attendeeId',
  authenticate,
  validateBody(updateAttendeeSchema),
  updateRetroAttendee
);
router.delete('/attendees/:attendeeId', authenticate, deleteRetroAttendee);

export default router;

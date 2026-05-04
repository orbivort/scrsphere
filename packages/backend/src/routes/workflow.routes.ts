// Workflow Management Routes
import { Router, type Router as RouterType } from 'express';
import * as workflowController from '../controllers/workflow.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Static routes first (no parameters)
router.post('/validate', workflowController.validateTransition);
router.post('/status-change', workflowController.executeStatusChange);

// Admin endpoints - require admin role
router.post('/admin/create', requireRoles('admin'), workflowController.createWorkflow);
router.post('/admin/states', requireRoles('admin'), workflowController.addWorkflowState);
router.post('/admin/transitions', requireRoles('admin'), workflowController.addWorkflowTransition);

// Dynamic routes with parameters - more specific routes first
router.get('/:entityType/:entityId/history', workflowController.getStatusChangeHistory);
router.get(
  '/:entityType/allowed-transitions/:fromStatus',
  workflowController.getAllowedTransitions
);
router.get('/:entityType/states', workflowController.getWorkflowStates);
router.get('/:entityType/transitions', workflowController.getWorkflowTransitions);
router.get('/:entityType', workflowController.getWorkflowByEntityType);

export default router;

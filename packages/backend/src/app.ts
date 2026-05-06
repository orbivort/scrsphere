// Express Application Setup
import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import config from './config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import teamRoutes from './routes/team.routes';
import backlogRoutes from './routes/backlog.routes';
import sprintRoutes from './routes/sprint.routes';
import goalsRoutes from './routes/goals.routes';
import workflowRoutes from './routes/workflow.routes';
import sprintConfigurationRoutes from './routes/sprintConfiguration.routes';
import dailyUpdateRoutes from './routes/dailyUpdate.routes';
import incrementRoutes from './routes/increment.routes';
import sprintReviewRoutes from './routes/sprintReview.routes';
import retrospectiveRoutes from './routes/retrospective.routes';
import impedimentRoutes from './routes/impediment.routes';
import reportsRoutes from './routes/reports.routes';
import notificationRoutes from './routes/notification.routes';
import configRoutes from './routes/config.routes';
import dataExportRoutes from './routes/dataExport.routes';
import consentRoutes from './routes/consent.routes';
import { requestLogger } from './middleware/requestLogger.middleware';
import { requestId } from './middleware/requestId.middleware';
import { contextMiddleware } from './middleware/context.middleware';
import { csrfProtectionMiddleware, ensureCsrfToken } from './middleware/csrf.middleware';
import { versionMiddleware } from './middleware/version.middleware';
import { eventLoopMonitor } from './utils/eventLoopMonitor';
import { checkHealth } from './utils/prisma';

const app: Application = express();

if (config.eventLoop.enabled) {
  eventLoopMonitor.start();
}

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for httpOnly cookies
app.use(cookieParser());

app.use(compression());

app.use(requestId);

// Initialize request context for AsyncLocalStorage
// This must come after requestId middleware
app.use(contextMiddleware);

// API version detection and validation
app.use(versionMiddleware);

// Ensure CSRF token cookie is set for all requests
app.use(ensureCsrfToken);

// Enforce CSRF protection for state-changing requests
app.use(csrfProtectionMiddleware);

// CSRF protection for state-changing operations (POST, PUT, DELETE, PATCH)
// This must come after cookie parser and before routes
app.use(csrfProtectionMiddleware);

// Rate limiting (disabled in test environment)
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const eventLoopMetrics = eventLoopMonitor.getMetrics(true);

  let databaseHealth: {
    status: 'connected' | 'disconnected' | 'timeout';
    responseTime?: number;
    error?: string;
  };
  try {
    databaseHealth = await checkHealth(config.healthCheck.databaseTimeout);
  } catch (error) {
    databaseHealth = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (databaseHealth.status === 'disconnected' || databaseHealth.status === 'timeout') {
    status = 'unhealthy';
  } else if (eventLoopMetrics.max > config.eventLoop.criticalThreshold) {
    status = 'unhealthy';
  } else if (eventLoopMetrics.max > config.eventLoop.warnThreshold) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  const httpStatus = status === 'unhealthy' ? 503 : 200;

  res.status(httpStatus).json({
    success: status !== 'unhealthy',
    data: {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      eventLoop: eventLoopMetrics,
      database: databaseHealth,
    },
  });
});

// API routes - Version 1
const v1Router = express.Router();

// Auth routes
v1Router.use('/auth', authRoutes);

// Team routes
v1Router.use('/teams', teamRoutes);

// Product Backlog routes
v1Router.use('/product-backlog', backlogRoutes);

// Product Goals routes
v1Router.use('/product-goals', goalsRoutes);

// Workflow management routes
v1Router.use('/workflows', workflowRoutes);

// Sprint routes (includes sprint-backlog)
v1Router.use('/sprints', sprintRoutes);
v1Router.use('/sprint-backlog', sprintRoutes);

// Sprint Configuration routes
v1Router.use('/sprint-configuration', sprintConfigurationRoutes);

// Daily Updates routes
v1Router.use('/daily-updates', dailyUpdateRoutes);

// Increment routes
v1Router.use('/increments', incrementRoutes);

// Sprint Review routes
v1Router.use('/sprint-reviews', sprintReviewRoutes);
v1Router.use('/retrospectives', retrospectiveRoutes);
v1Router.use('/impediments', impedimentRoutes);
v1Router.use('/reports', reportsRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/config', configRoutes);

// Data Export routes (GDPR Article 20 - Right to Data Portability)
v1Router.use('/user', dataExportRoutes);

// Consent routes (GDPR Article 7 - Consent Management)
v1Router.use('/consent', consentRoutes);

// Mount versioned API routers
app.use('/api/v1', v1Router);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

// Input Sanitization Utility
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';

export const sanitizeString = (value: string): string => {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

export const sanitizedStringSchema = z.string().transform(sanitizeString);

export const sanitizeBody = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else {
          sanitized[key] = value;
        }
      }
      req.body = sanitized;
    }
    next();
  };
};

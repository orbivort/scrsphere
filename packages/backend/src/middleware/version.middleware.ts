import type { Request, Response, NextFunction } from 'express';
import { API_VERSIONS } from '../config/versions';
import type { VersionInfo } from '../types/version.types';
import { BadRequestError } from '../utils/errors';

const VERSION_PATTERN = /\/api\/v(\w+)\//;

const SUNSET_WARNING_THRESHOLD_DAYS = 90;

function formatSunsetDate(date: Date): string {
  return date.toUTCString();
}

function getDaysUntilSunset(sunsetDate: Date): number {
  const now = new Date();
  const diffMs = sunsetDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export const versionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const match = req.path.match(VERSION_PATTERN);

  let version: number;

  if (match?.[1]) {
    const versionStr = match[1];
    const parsed = parseInt(versionStr, 10);
    if (Number.isNaN(parsed) || versionStr !== parsed.toString()) {
      throw new BadRequestError(`Unsupported API version: v${versionStr}`, [
        {
          field: 'version',
          message: `Supported versions: ${API_VERSIONS.SUPPORTED_VERSIONS.join(', ')}`,
        },
      ]);
    }
    version = parsed;
  } else {
    version = API_VERSIONS.CURRENT;
  }

  if (!API_VERSIONS.SUPPORTED_VERSIONS.includes(version as never)) {
    throw new BadRequestError(`Unsupported API version: v${version}`, [
      {
        field: 'version',
        message: `Supported versions: ${API_VERSIONS.SUPPORTED_VERSIONS.join(', ')}`,
      },
    ]);
  }

  req.apiVersion = version;
  res.setHeader('X-API-Version', version.toString());

  if (API_VERSIONS.DEPRECATED_VERSIONS.includes(version)) {
    res.setHeader('Deprecation', 'true');

    const versionInfo = (API_VERSIONS.VERSION_INFO as Record<number, VersionInfo>)[version];
    if (versionInfo?.sunsetDate) {
      res.setHeader('Sunset', formatSunsetDate(versionInfo.sunsetDate));

      const successorVersion = version + 1;
      res.setHeader('Link', `</api/v${successorVersion}>; rel="successor-version"`);

      const daysUntilSunset = getDaysUntilSunset(versionInfo.sunsetDate);
      if (daysUntilSunset <= SUNSET_WARNING_THRESHOLD_DAYS) {
        res.setHeader(
          'Warning',
          `299 - "API version v${version} will be sunset in ${daysUntilSunset} days"`
        );
      }
    }
  }

  next();
};

export default versionMiddleware;

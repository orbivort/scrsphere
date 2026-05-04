import type { VersionInfo, VersionStatus } from '../types/version.types';

export const API_VERSIONS = {
  CURRENT: 1 as const,

  MINIMUM_SUPPORTED: 1 as const,

  SUPPORTED_VERSIONS: [1] as const,

  DEPRECATED_VERSIONS: [] as number[],

  VERSION_INFO: {
    1: {
      version: 1,
      status: 'current' as VersionStatus,
      releaseDate: new Date('2026-04-29'),
      sunsetDate: null as Date | null,
      deprecationDate: null as Date | null,
      documentation: '/docs/api/v1/',
      migrationGuide: null as string | null,
    },
  } satisfies Record<number, VersionInfo>,

  SUNSET_PERIOD_MONTHS: 6,
  SUPPORT_PERIOD_MONTHS: 12,

  FEATURES: {
    V2_ENABLED: false,
    V2_BETA_ACCESS: [] as string[],
  },
} as const;

export type ApiVersion = (typeof API_VERSIONS.SUPPORTED_VERSIONS)[number];
export type { VersionInfo, VersionStatus };

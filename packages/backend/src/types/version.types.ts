export type VersionStatus = 'current' | 'supported' | 'deprecated' | 'sunset';

export interface VersionInfo {
  version: number;
  status: VersionStatus;
  releaseDate: Date;
  sunsetDate: Date | null;
  deprecationDate: Date | null;
  documentation: string;
  migrationGuide: string | null;
}

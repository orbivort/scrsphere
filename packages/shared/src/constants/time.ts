export const TIME = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

export const formatMilliseconds = (ms: number): string => {
  if (ms < TIME.SECOND) return `${ms}ms`;
  if (ms < TIME.MINUTE) return `${Math.floor(ms / TIME.SECOND)}s`;
  if (ms < TIME.HOUR) return `${Math.floor(ms / TIME.MINUTE)}m`;
  if (ms < TIME.DAY) return `${Math.floor(ms / TIME.HOUR)}h`;
  return `${Math.floor(ms / TIME.DAY)}d`;
};

export const parseDuration = (duration: string): number => {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value * TIME.SECOND;
    case 'm':
      return value * TIME.MINUTE;
    case 'h':
      return value * TIME.HOUR;
    case 'd':
      return value * TIME.DAY;
    default:
      return value;
  }
};

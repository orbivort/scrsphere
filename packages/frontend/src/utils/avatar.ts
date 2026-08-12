const AVATAR_SERVICE_URL = import.meta.env.VITE_AVATAR_SERVICE_URL ?? '';

export const generateAvatarUrl = (seed: string): string => {
  if (!AVATAR_SERVICE_URL) {
    return '';
  }
  return `${AVATAR_SERVICE_URL}?seed=${encodeURIComponent(seed)}`;
};

export const getAvatarServiceUrl = (): string => {
  return AVATAR_SERVICE_URL;
};

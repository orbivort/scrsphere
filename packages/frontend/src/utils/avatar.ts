const AVATAR_SERVICE_URL =
  import.meta.env.VITE_AVATAR_SERVICE_URL ?? 'https://api.dicebear.com/7.x/avataaars/svg';

export const generateAvatarUrl = (seed: string): string => {
  return `${AVATAR_SERVICE_URL}?seed=${encodeURIComponent(seed)}`;
};

export const getAvatarServiceUrl = (): string => {
  return AVATAR_SERVICE_URL;
};

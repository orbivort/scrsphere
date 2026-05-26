const getBasePath = (): string => {
  const basePath = import.meta.env.VITE_BASE_PATH ?? '/';
  if (basePath === '/') {
    return '';
  }
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
};

export const getFullPath = (path: string): string => {
  const basePath = getBasePath();
  if (!basePath) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${basePath}${path}`;
  }
  return `${basePath}/${path}`;
};

export const navigateTo = (path: string): void => {
  window.location.href = getFullPath(path);
};

export const getRouterBasename = (): string => {
  const basePath = import.meta.env.VITE_BASE_PATH ?? '/';
  return basePath.endsWith('/') && basePath.length > 1 ? basePath.slice(0, -1) : basePath;
};

export const getCurrentPath = (): string => {
  const basePath = getRouterBasename();
  const pathname = window.location.pathname;
  if (basePath && basePath !== '/' && pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length) || '/';
  }
  return pathname;
};

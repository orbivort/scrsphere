import { lazy, type ComponentType } from 'react';

import { i18nInstance } from './config';

/**
 * Wraps a lazy component import to also load the required i18n namespace
 * before rendering the component. This ensures translations are available
 * when the component mounts.
 */
export function withNamespace<T extends ComponentType<unknown>>(
  ns: string | string[],
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    await i18nInstance.loadNamespaces(Array.isArray(ns) ? ns : [ns]);
    return factory();
  });
}

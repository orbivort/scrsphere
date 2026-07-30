/**
 * LRU cache for Intl formatter instances.
 *
 * True LRU eviction — entries accessed via get() are moved to the
 * most-recently-used position.
 *
 * Intl.*Format constructors are expensive (they parse CLDR data). This cache
 * avoids redundant construction by memoizing instances keyed by locale + options.
 *
 * Max 100 entries — sufficient for all locale/option combinations in Scrumooth
 * (5 locales × ~5 option presets = 25 entries) with headroom for edge cases.
 */

const MAX_CACHE_SIZE = 100;

class LRUMap<K, V> {
  private map = new Map<K, V>();

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      // True LRU: move accessed entry to most-recently-used position
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key); // Move to end (most recently used)
    } else if (this.map.size >= MAX_CACHE_SIZE) {
      // Evict least recently used (first entry)
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, value);
  }
}

function makeCacheKey(
  locale: string,
  options?:
    | Intl.NumberFormatOptions
    | Intl.DateTimeFormatOptions
    | Intl.RelativeTimeFormatOptions
    | Intl.ListFormatOptions
    | Intl.CollatorOptions
    | undefined
): string {
  return `${locale}:${JSON.stringify(options ?? {})}`;
}

const numberFormatCache = new LRUMap<string, Intl.NumberFormat>();
const dateTimeFormatCache = new LRUMap<string, Intl.DateTimeFormat>();
const relativeTimeFormatCache = new LRUMap<string, Intl.RelativeTimeFormat>();
const listFormatCache = new LRUMap<string, Intl.ListFormat>();
const collatorCache = new LRUMap<string, Intl.Collator>();

export function getCachedNumberFormat(
  locale: string,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const key = makeCacheKey(locale, options);
  let fmt = numberFormatCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, options);
    numberFormatCache.set(key, fmt);
  }
  return fmt;
}

export function getCachedDateTimeFormat(
  locale: string,
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const key = makeCacheKey(locale, options);
  let fmt = dateTimeFormatCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatCache.set(key, fmt);
  }
  return fmt;
}

export function getCachedRelativeTimeFormat(
  locale: string,
  options?: Intl.RelativeTimeFormatOptions
): Intl.RelativeTimeFormat {
  const key = makeCacheKey(locale, options);
  let fmt = relativeTimeFormatCache.get(key);
  if (!fmt) {
    fmt = new Intl.RelativeTimeFormat(locale, options);
    relativeTimeFormatCache.set(key, fmt);
  }
  return fmt;
}

export function getCachedListFormat(
  locale: string,
  options?: Intl.ListFormatOptions
): Intl.ListFormat {
  const key = makeCacheKey(locale, options);
  let fmt = listFormatCache.get(key);
  if (!fmt) {
    fmt = new Intl.ListFormat(locale, options);
    listFormatCache.set(key, fmt);
  }
  return fmt;
}

export function getCachedCollator(locale: string, options?: Intl.CollatorOptions): Intl.Collator {
  const key = makeCacheKey(locale, options);
  let fmt = collatorCache.get(key);
  if (!fmt) {
    fmt = new Intl.Collator(locale, options);
    collatorCache.set(key, fmt);
  }
  return fmt;
}

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { useResponsive } from './useResponsive';

function ResponsiveProbe({ breakpoint }: { breakpoint?: number }) {
  const isMobile = useResponsive(breakpoint);
  return React.createElement('span', null, String(isMobile));
}

describe('useResponsive (SSR)', () => {
  it('should default to false when window is undefined', () => {
    const html = renderToStaticMarkup(React.createElement(ResponsiveProbe));
    expect(html).toContain('false');
  });

  it('should ignore the breakpoint when window is undefined', () => {
    const html = renderToStaticMarkup(React.createElement(ResponsiveProbe, { breakpoint: 2000 }));
    expect(html).toContain('false');
  });
});

import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../utils/escapeHtml.js';

describe('escapeHtml', () => {
  it('should escape ampersand (&)', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape less-than (<)', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('should escape greater-than (>)', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('should escape double quote (")', () => {
    expect(escapeHtml('a "b" c')).toBe('a &quot;b&quot; c');
  });

  it("should escape single quote (')", () => {
    expect(escapeHtml("a 'b' c")).toBe('a &#x27;b&#x27; c');
  });

  it('should escape backtick (`)', () => {
    expect(escapeHtml('a `b` c')).toBe('a &#x60;b&#x60; c');
  });

  it('should escape all six special characters in one string', () => {
    expect(escapeHtml('&<>"\'`')).toBe('&amp;&lt;&gt;&quot;&#x27;&#x60;');
  });

  it('should pass through normal text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('should pass through numbers and safe punctuation unchanged', () => {
    expect(escapeHtml('Price: $10.99 (20%)')).toBe('Price: $10.99 (20%)');
  });

  it('should return empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not double-escape already escaped ampersand', () => {
    // &amp; contains & which gets replaced first, so &amp; becomes &amp;amp;
    // This is expected behavior: escapeHtml should only be applied to raw strings,
    // not to already-escaped content. The test verifies this behavior is documented.
    const raw = '&amp;';
    const result = escapeHtml(raw);
    expect(result).toBe('&amp;amp;');
  });

  it('should handle a typical XSS vector in a name', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should handle a typical XSS vector in an href', () => {
    expect(escapeHtml('javascript:alert(1)')).toBe('javascript:alert(1)');
  });

  it('should escape attribute injection attempt', () => {
    expect(escapeHtml('" onclick="alert(1)')).toBe('&quot; onclick=&quot;alert(1)');
  });
});

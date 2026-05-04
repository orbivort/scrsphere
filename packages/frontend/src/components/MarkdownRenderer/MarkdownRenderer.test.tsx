import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vi-axe';

import { MarkdownRenderer } from './MarkdownRenderer';
import type React from 'react';

vi.mock('./MarkdownRenderer.module.css', () => ({
  default: {
    container: 'container',
    title: 'title',
    'section-title': 'section-title',
    'subsection-title': 'subsection-title',
    paragraph: 'paragraph',
    list: 'list',
    'list-item': 'list-item',
    link: 'link',
    strong: 'strong',
    divider: 'divider',
  },
}));

describe('MarkdownRenderer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering Tests', () => {
    it('should render markdown content', () => {
      const content = '# Hello World';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render empty content without errors', () => {
      expect(() => render(<MarkdownRenderer content="" />)).not.toThrow();
    });

    it('should render container element', () => {
      const { container } = render(<MarkdownRenderer content="# Test" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Heading Tests', () => {
    it('should render h1 with title class', () => {
      const content = '# Main Title';
      render(<MarkdownRenderer content={content} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1.className).toContain('title');
    });

    it('should render h2 with section-title class', () => {
      const content = '## Section Title';
      render(<MarkdownRenderer content={content} />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
      expect(h2.className).toContain('section-title');
    });

    it('should render h3 with subsection-title class', () => {
      const content = '### Subsection Title';
      render(<MarkdownRenderer content={content} />);

      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3).toBeInTheDocument();
      expect(h3.className).toContain('subsection-title');
    });

    it('should render h2 with id attribute when provided', () => {
      const content = '## Section With ID';
      render(<MarkdownRenderer content={content} />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
    });

    it('should render multiple headings', () => {
      const content = '# Title\n## Section\n### Subsection';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Paragraph Tests', () => {
    it('should render paragraph with paragraph class', () => {
      const content = 'This is a paragraph.';
      render(<MarkdownRenderer content={content} />);

      const p = screen.getByText('This is a paragraph.');
      expect(p).toBeInTheDocument();
      expect(p.className).toContain('paragraph');
    });

    it('should render multiple paragraphs', () => {
      const content = 'First paragraph.\n\nSecond paragraph.';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('First paragraph.')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    });
  });

  describe('List Tests', () => {
    it('should render unordered list with list class', () => {
      const content = '- Item 1\n- Item 2\n- Item 3';
      render(<MarkdownRenderer content={content} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list.className).toContain('list');
    });

    it('should render ordered list with list class', () => {
      const content = '1. First\n2. Second\n3. Third';
      render(<MarkdownRenderer content={content} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('OL');
    });

    it('should render list items with list-item class', () => {
      const content = '- Item 1\n- Item 2';
      render(<MarkdownRenderer content={content} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
      expect(items[0].className).toContain('list-item');
    });

    it('should render nested lists', () => {
      const content = '- Item 1\n  - Nested Item\n- Item 2';
      render(<MarkdownRenderer content={content} />);

      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(2);
    });

    it('should render ordered list items correctly', () => {
      const content = '1. First\n2. Second';
      render(<MarkdownRenderer content={content} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });
  });

  describe('Link Tests', () => {
    it('should render link with link class', () => {
      const content = '[Click here](https://example.com)';
      render(<MarkdownRenderer content={content} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link.className).toContain('link');
      expect(link).toHaveTextContent('Click here');
    });

    it('should render multiple links', () => {
      const content = '[Link 1](https://example1.com) and [Link 2](https://example2.com)';
      render(<MarkdownRenderer content={content} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });
  });

  describe('Text Formatting Tests', () => {
    it('should render strong text with strong class', () => {
      const content = 'This is **bold text**';
      render(<MarkdownRenderer content={content} />);

      const strong = screen.getByText('bold text');
      expect(strong.tagName).toBe('STRONG');
      expect(strong.className).toContain('strong');
    });

    it('should render emphasis correctly', () => {
      const content = 'This is *italic text*';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('italic text')).toBeInTheDocument();
    });
  });

  describe('Horizontal Rule Tests', () => {
    it('should render hr with divider class', () => {
      const content = 'Before\n\n---\n\nAfter';
      render(<MarkdownRenderer content={content} />);

      const hr = document.querySelector('hr');
      expect(hr).toBeInTheDocument();
      expect(hr?.className).toContain('divider');
    });
  });

  describe('GitHub Flavored Markdown Tests', () => {
    it('should render tables', () => {
      const content = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });

    it('should render task lists', () => {
      const content = '- [ ] Unchecked task\n- [x] Checked task';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Unchecked task')).toBeInTheDocument();
      expect(screen.getByText('Checked task')).toBeInTheDocument();
    });

    it('should render strikethrough', () => {
      const content = '~~deleted text~~';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('deleted text')).toBeInTheDocument();
    });

    it('should render code blocks', () => {
      const content = '```\nconst code = "block";\n```';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('const code = "block";')).toBeInTheDocument();
    });

    it('should render inline code', () => {
      const content = 'Use `console.log()` for debugging';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('console.log()')).toBeInTheDocument();
    });
  });

  describe('Custom Components Tests', () => {
    it('should merge custom components with defaults', () => {
      const CustomComponent: React.FC<Record<string, unknown>> = () => (
        <span>Custom Component</span>
      );

      render(
        <MarkdownRenderer content="## Custom Section" customComponents={{ h2: CustomComponent }} />
      );

      expect(screen.getByText('Custom Component')).toBeInTheDocument();
    });

    it('should allow custom components to override heading styles', () => {
      const CustomH1: React.FC<Record<string, unknown>> = ({ children }) => (
        <h1 className="custom-h1">{children}</h1>
      );

      const content = '# Custom Heading';
      render(<MarkdownRenderer content={content} customComponents={{ h1: CustomH1 }} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveClass('custom-h1');
    });

    it('should allow custom components for multiple element types', () => {
      const CustomParagraph: React.FC<Record<string, unknown>> = ({ children }) => (
        <div className="custom-p">{children}</div>
      );

      const CustomLink: React.FC<Record<string, unknown>> = ({ children, href }) => (
        <a href={href} className="custom-link">
          {children}
        </a>
      );

      const content = 'Paragraph with [link](https://example.com)';
      render(
        <MarkdownRenderer
          content={content}
          customComponents={{ p: CustomParagraph, a: CustomLink }}
        />
      );

      expect(screen.getByText(/Paragraph with/)).toBeInTheDocument();
    });
  });

  describe('ClassName Prop Tests', () => {
    it('should apply custom className to container', () => {
      const { container } = render(<MarkdownRenderer content="# Test" className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should combine container class with default class', () => {
      const { container } = render(<MarkdownRenderer content="# Test" className="my-class" />);

      expect(container.firstChild).toHaveClass('container');
      expect(container.firstChild).toHaveClass('my-class');
    });

    it('should handle empty className', () => {
      const { container } = render(<MarkdownRenderer content="# Test" className="" />);

      expect(container.firstChild).toHaveClass('container');
    });
  });

  describe('Sanitization Tests', () => {
    it('should sanitize potentially harmful HTML', () => {
      const content = '<script>alert("xss")</script>';
      render(<MarkdownRenderer content={content} />);

      expect(screen.queryByText('<script>alert("xss")</script>')).not.toBeInTheDocument();
    });

    it('should allow safe HTML tags', () => {
      const content = '<strong>Bold text</strong>';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Bold text')).toBeInTheDocument();
    });
  });

  describe('Complex Content Tests', () => {
    it('should render complex markdown document', () => {
      const content = `# Main Title

## Section 1

This is a paragraph with **bold** and *italic* text.

### Subsection 1.1

- List item 1
- List item 2
- List item 3

## Section 2

1. Ordered item 1
2. Ordered item 2

[Link text](https://example.com)

---

End of document`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText(/This is a paragraph/)).toBeInTheDocument();
      expect(screen.getAllByRole('list')).toHaveLength(2);
      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(document.querySelector('hr')).toBeInTheDocument();
    });

    it('should render nested formatting', () => {
      const content = '**Bold with `code` inside**';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText(/Bold with/)).toBeInTheDocument();
    });

    it('should render blockquotes', () => {
      const content = '> This is a quote';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('This is a quote')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have no accessibility violations for simple content', async () => {
      const { container } = render(<MarkdownRenderer content="# Title\n\nParagraph" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for complex content', async () => {
      const content = `# Heading

## Subheading

- List item 1
- List item 2

[Link](https://example.com)`;

      const { container } = render(<MarkdownRenderer content={content} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for links', async () => {
      const content = '[Visit our site](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for lists', async () => {
      const content = '- Item 1\n- Item 2\n- Item 3';
      const { container } = render(<MarkdownRenderer content={content} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      const content = `# Title\n\n${'Paragraph '.repeat(1000)}`;
      expect(() => render(<MarkdownRenderer content={content} />)).not.toThrow();
    });

    it('should handle special characters in content', () => {
      const content = '# Title with <special> & "characters"';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should handle unicode content', () => {
      const content = '# 日本語タイトル\n\nЭто русский текст\n\n中文内容';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should handle content with only whitespace', () => {
      const content = '   \n\n   \n   ';
      expect(() => render(<MarkdownRenderer content={content} />)).not.toThrow();
    });

    it('should handle markdown with HTML entities', () => {
      const content = 'Copyright &copy; 2024 &mdash; Company Name';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText(/Copyright/)).toBeInTheDocument();
    });

    it('should handle deeply nested lists', () => {
      const content = `- Level 1
  - Level 2
    - Level 3
      - Level 4`;
      render(<MarkdownRenderer content={content} />);

      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('should handle mixed list types', () => {
      const content = '1. Ordered\n2. Ordered\n- Unordered\n- Unordered';
      render(<MarkdownRenderer content={content} />);

      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(2);
    });
  });

  describe('Default Components Behavior', () => {
    it('should apply title class to h1', () => {
      const content = '# Main Title';
      render(<MarkdownRenderer content={content} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1.className).toBe('title');
    });

    it('should apply section-title class to h2', () => {
      const content = '## Section';
      render(<MarkdownRenderer content={content} />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2.className).toBe('section-title');
    });

    it('should apply subsection-title class to h3', () => {
      const content = '### Subsection';
      render(<MarkdownRenderer content={content} />);

      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3.className).toBe('subsection-title');
    });

    it('should apply paragraph class to p', () => {
      const content = 'Paragraph text';
      render(<MarkdownRenderer content={content} />);

      const p = screen.getByText('Paragraph text');
      expect(p.className).toBe('paragraph');
    });

    it('should apply list class to ul and ol', () => {
      const ulContent = '- Item';
      render(<MarkdownRenderer content={ulContent} />);

      const ul = screen.getByRole('list');
      expect(ul.className).toBe('list');
    });

    it('should apply list-item class to li', () => {
      const content = '- Item';
      render(<MarkdownRenderer content={content} />);

      const li = screen.getByRole('listitem');
      expect(li.className).toBe('list-item');
    });

    it('should apply link class to a', () => {
      const content = '[Link](https://example.com)';
      render(<MarkdownRenderer content={content} />);

      const link = screen.getByRole('link');
      expect(link.className).toBe('link');
    });

    it('should apply strong class to strong', () => {
      const content = '**Bold**';
      render(<MarkdownRenderer content={content} />);

      const strong = screen.getByText('Bold');
      expect(strong.className).toBe('strong');
    });

    it('should apply divider class to hr', () => {
      const content = '---';
      render(<MarkdownRenderer content={content} />);

      const hr = document.querySelector('hr');
      expect(hr?.className).toBe('divider');
    });
  });

  describe('Remark GFM Plugin Tests', () => {
    it('should render strikethrough with GFM', () => {
      const content = '~~strikethrough~~';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('strikethrough')).toBeInTheDocument();
    });

    it('should render table with GFM', () => {
      const content = '| Header |\n| ------- |\n| Cell    |';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Cell')).toBeInTheDocument();
    });

    it('should render task list with GFM', () => {
      const content = '- [ ] Unchecked\n- [x] Checked';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Unchecked')).toBeInTheDocument();
      expect(screen.getByText('Checked')).toBeInTheDocument();
    });
  });

  describe('Rehype Sanitize Plugin Tests', () => {
    it('should remove dangerous HTML attributes', () => {
      const content = '<a href="javascript:alert(1)">Click</a>';
      render(<MarkdownRenderer content={content} />);

      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });

    it('should allow safe HTML through sanitization', () => {
      const content = '<em>emphasized</em>';
      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('emphasized')).toBeInTheDocument();
    });
  });
});

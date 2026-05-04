import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  customComponents?: Record<string, React.FC<Record<string, unknown>>>;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  customComponents = {},
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => <h1 className={styles.title}>{children}</h1>,
          h2: ({ children, id }) => (
            <h2 id={id} className={styles['section-title']}>
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className={styles['subsection-title']}>{children}</h3>,
          p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
          ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
          li: ({ children }) => <li className={styles['list-item']}>{children}</li>,
          a: ({ href, children }) => (
            <a href={href} className={styles.link}>
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
          hr: () => <hr className={styles.divider} />,
          ...customComponents,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

export default MarkdownRenderer;

import React, { useState } from 'react';

import styles from './HelpPanel.module.css';

interface HelpExample {
  label: string;
  text: string;
}

interface HelpPanelProps {
  title: string;
  tips: string[];
  examples?: {
    good?: HelpExample;
    avoid?: HelpExample;
  };
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ title, tips, examples }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles['help-panel']}>
      <button
        type="button"
        className={styles['help-trigger']}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="help-content"
      >
        <span className={styles['help-icon']}>💡</span>
        <span className={styles['help-text']}>Tips for {title}</span>
        <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div id="help-content" className={styles['help-content']} role="region">
          <ul className={styles['tips-list']}>
            {tips.map((tip, index) => (
              <li key={index} className={styles['tip-item']}>
                {tip}
              </li>
            ))}
          </ul>

          {examples && (
            <div className={styles.examples}>
              {examples.good && (
                <div className={`${styles.example} ${styles['good-example']}`}>
                  <span className={styles['example-label']}>✓ Good example:</span>
                  <p className={styles['example-text']}>{examples.good.text}</p>
                </div>
              )}
              {examples.avoid && (
                <div className={`${styles.example} ${styles['avoid-example']}`}>
                  <span className={styles['example-label']}>✗ Avoid:</span>
                  <p className={styles['example-text']}>{examples.avoid.text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

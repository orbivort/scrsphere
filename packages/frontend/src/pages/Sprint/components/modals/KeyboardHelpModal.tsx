import React from 'react';

import baseStyles from './base/ModalBase.module.css';
import styles from './KeyboardHelpModal.module.css';

import { CloseIcon, KeyboardIcon } from '@/components/common/Icons';

export interface KeyboardHelpModalProps {
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ onClose }) => {
  return (
    <div
      className={baseStyles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
      onClick={onClose}
    >
      <div
        className={`${baseStyles.modal} ${styles['keyboard-help-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={baseStyles['modal-header']}>
          <h2 id="keyboard-help-title" className={baseStyles['modal-title']}>
            <KeyboardIcon size={24} aria-hidden="true" /> Keyboard Shortcuts
          </h2>
          <button
            className={baseStyles['modal-close']}
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
            data-modal-close
          >
            <CloseIcon size={14} aria-hidden="true" />
          </button>
        </div>
        <div className={baseStyles['modal-body']}>
          <div className={styles['keyboard-shortcuts-grid']}>
            <section className={styles['shortcut-section']}>
              <h3 className={styles['shortcut-section-title']}>Navigation</h3>
              <dl className={styles['shortcut-list']}>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Tab</kbd>
                  </dt>
                  <dd>Move focus to next element</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Shift</kbd> + <kbd>Tab</kbd>
                  </dt>
                  <dd>Move focus to previous element</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Enter</kbd>
                  </dt>
                  <dd>Open selected task or activate button</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Escape</kbd>
                  </dt>
                  <dd>Close modal or cancel action</dd>
                </div>
              </dl>
            </section>

            <section className={styles['shortcut-section']}>
              <h3 className={styles['shortcut-section-title']}>Task Actions</h3>
              <dl className={styles['shortcut-list']}>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>→</kbd> (Right Arrow)
                  </dt>
                  <dd>Move task to next column</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>←</kbd> (Left Arrow)
                  </dt>
                  <dd>Move task to previous column</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Space</kbd>
                  </dt>
                  <dd>Start dragging task (use arrows to move)</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>e</kbd>
                  </dt>
                  <dd>Edit selected task</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>d</kbd>
                  </dt>
                  <dd>Delete selected task</dd>
                </div>
              </dl>
            </section>

            <section className={styles['shortcut-section']}>
              <h3 className={styles['shortcut-section-title']}>Board Actions</h3>
              <dl className={styles['shortcut-list']}>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>n</kbd>
                  </dt>
                  <dd>Create new task</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>b</kbd>
                  </dt>
                  <dd>Toggle burndown chart</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>s</kbd>
                  </dt>
                  <dd>Focus search box</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>?</kbd>
                  </dt>
                  <dd>Show this help dialog</dd>
                </div>
              </dl>
            </section>
          </div>

          <div className={styles['keyboard-help-tip']}>
            <p>
              <strong>Tip:</strong> Use the skip link (first tab stop) to bypass navigation and go
              directly to the task board.
            </p>
          </div>
        </div>
        <div className={baseStyles['modal-footer']}>
          <button
            className={`${baseStyles.button} ${baseStyles['button-secondary']}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

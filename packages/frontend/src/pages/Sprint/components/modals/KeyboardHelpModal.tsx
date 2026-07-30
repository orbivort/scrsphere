import React from 'react';
import { useTranslation } from 'react-i18next';

import baseStyles from './base/ModalBase.module.css';
import styles from './KeyboardHelpModal.module.css';

import { CloseIcon, KeyboardIcon } from '@/components/common/Icons';

export interface KeyboardHelpModalProps {
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ onClose }) => {
  const { t } = useTranslation('sprint');

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
            <KeyboardIcon size={24} aria-hidden="true" /> {t('keyboardHelp.title')}
          </h2>
          <button
            className={baseStyles['modal-close']}
            onClick={onClose}
            aria-label={t('keyboardHelp.closeShortcutsHelp')}
            data-modal-close
          >
            <CloseIcon size={14} aria-hidden="true" />
          </button>
        </div>
        <div className={baseStyles['modal-body']}>
          <div className={styles['keyboard-shortcuts-grid']}>
            {/* eslint-disable no-literal-jsx-string/no-literal-jsx-string -- Keyboard key names should not be translated */}
            <section className={styles['shortcut-section']}>
              <h3 className={styles['shortcut-section-title']}>{t('keyboardHelp.navigation')}</h3>
              <dl className={styles['shortcut-list']}>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Tab</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.moveFocusNext')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Shift</kbd> + <kbd>Tab</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.moveFocusPrevious')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Enter</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.openOrActivate')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Escape</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.closeOrCancel')}</dd>
                </div>
              </dl>
            </section>

            <section className={styles['shortcut-section']}>
              <h3 className={styles['shortcut-section-title']}>{t('keyboardHelp.taskActions')}</h3>
              <dl className={styles['shortcut-list']}>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>→</kbd> {t('keyboardHelp.rightArrowLabel')}
                  </dt>
                  <dd>{t('keyboardHelp.moveNextColumn')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>←</kbd> {t('keyboardHelp.leftArrowLabel')}
                  </dt>
                  <dd>{t('keyboardHelp.movePreviousColumn')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>Space</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.startDragging')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>e</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.editTask')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>d</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.deleteTask')}</dd>
                </div>
              </dl>
            </section>

            <section className={styles['shortcut-section']}>
              <h3 className={styles['shortcut-section-title']}>{t('keyboardHelp.boardActions')}</h3>
              <dl className={styles['shortcut-list']}>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>n</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.createTask')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>b</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.toggleBurndown')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>s</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.focusSearch')}</dd>
                </div>
                <div className={styles['shortcut-item']}>
                  <dt>
                    <kbd>?</kbd>
                  </dt>
                  <dd>{t('keyboardHelp.showHelp')}</dd>
                </div>
              </dl>
            </section>
          </div>
          {/* eslint-enable no-literal-jsx-string/no-literal-jsx-string */}

          <div className={styles['keyboard-help-tip']}>
            <p>{t('keyboardHelp.tip')}</p>
          </div>
        </div>
        <div className={baseStyles['modal-footer']}>
          <button
            className={`${baseStyles.button} ${baseStyles['button-secondary']}`}
            onClick={onClose}
          >
            {t('keyboardHelp.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

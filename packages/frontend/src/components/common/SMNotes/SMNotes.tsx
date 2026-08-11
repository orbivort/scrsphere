// SMNotes
// Editable text area for Scrum Master observations and coaching notes on
// Scrum events (Sprint, Sprint Review, Retrospective).
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../Button';
import { ClipboardIcon, SaveIcon } from '../Icons';

import styles from './SMNotes.module.css';

/** Maximum length for Scrum Master notes. Mirrors the shared DESCRIPTION_MAX limit. */
export const SM_NOTES_MAX_LENGTH = 2000;

interface SMNotesProps {
  /** Current note value. */
  value?: string | null;
  /** Called when the user saves notes. */
  onSave: (notes: string) => Promise<unknown> | void;
  /** Optional placeholder text. Defaults to the scrum-master-dashboard placeholder. */
  placeholder?: string;
  /** Show the editable form even when notes are empty. Defaults to true. */
  alwaysShow?: boolean;
  /** Disable editing and saving. Useful when the surrounding event is finalized. */
  disabled?: boolean;
}

export const SMNotes: React.FC<SMNotesProps> = ({
  value = '',
  onSave,
  placeholder,
  alwaysShow = true,
  disabled = false,
}) => {
  const { t } = useTranslation(['scrum-master-dashboard', 'common']);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(alwaysShow);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const validate = useCallback(
    (notes: string): string | null => {
      const trimmed = notes.trim();
      if (!trimmed) {
        return t('smNotes.emptyError');
      }
      if (trimmed.length > SM_NOTES_MAX_LENGTH) {
        return t('smNotes.maxLengthError');
      }
      const htmlTagPattern = /<[^>]*>/g;
      if (htmlTagPattern.test(trimmed)) {
        return t('smNotes.noHtmlTags');
      }
      return null;
    },
    [t]
  );

  const handleChange = useCallback((next: string) => {
    setDraft(next);
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (disabled) {
      return;
    }

    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      setSaved(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(draft);
      setSaved(true);
      setError(null);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(false);
      setError(t('smNotes.saveError'));
    } finally {
      setSaving(false);
    }
  }, [draft, onSave, validate, t, disabled]);

  const showForm = editing || (alwaysShow && !value);
  const hasError = Boolean(error);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <ClipboardIcon className={styles.icon} />
          {t('smNotes.title')}
        </h3>
        {!showForm && !disabled && (
          <button type="button" className={styles.editButton} onClick={() => setEditing(true)}>
            {t('common:edit')}
          </button>
        )}
      </div>

      {showForm ? (
        <>
          <textarea
            className={`${styles.textarea} ${hasError ? styles['textarea-error'] : ''}`}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder ?? t('smNotes.placeholder')}
            rows={4}
            maxLength={SM_NOTES_MAX_LENGTH}
            disabled={disabled}
            readOnly={disabled}
            aria-label={t('smNotes.title')}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'sm-notes-error' : undefined}
          />
          {hasError && (
            <p id="sm-notes-error" className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.footer}>
            <span
              className={`${styles.charCounter} ${draft.length > SM_NOTES_MAX_LENGTH - 200 ? styles['charCounter-warning'] : ''}`}
              aria-live="polite"
            >
              {t('smNotes.charCounter', { count: draft.length })}
            </span>
            <div className={styles.actions}>
              {!alwaysShow && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={disabled}
                >
                  {t('common:cancel')}
                </Button>
              )}
              {saved && <span className={styles.saved}>{t('smNotes.saved')}</span>}
              <Button
                onClick={() => void handleSave()}
                loading={saving}
                disabled={saving || disabled}
              >
                {!saving && <SaveIcon size={16} className={styles.saveIcon} />}
                {t('common:save')}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className={styles.notes}>{draft || t('common:noData')}</p>
      )}
    </div>
  );
};

export default SMNotes;

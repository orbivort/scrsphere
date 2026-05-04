import React, { useState, useEffect } from 'react';

import { getCategoryColor, type CategoryConfig } from './categories';
import styles from './DefinitionEditor.module.css';

import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  CircleIcon,
  TrashIcon,
  AlertTriangleIcon,
  SaveIcon,
} from '@/components/common/Icons';

interface DefinitionEditorProps<T> {
  definition: { items: T[]; version: number; updatedAt: string };
  definitionType: 'DoD' | 'DoR';
  categories: CategoryConfig[];
  onSave: (items: T[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DefinitionEditor<
  T extends {
    id: string;
    description: string;
    category?: string;
    isActive: boolean;
    order: number;
  },
>({
  definition,
  definitionType,
  categories,
  onSave,
  onCancel,
  isLoading = false,
}: DefinitionEditorProps<T>): React.ReactElement {
  const [items, setItems] = useState<T[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>(categories[0]?.value || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const definitionLabel = definitionType === 'DoD' ? 'Definition of Done' : 'Definition of Ready';
  const shortLabel = definitionType === 'DoD' ? 'DoD' : 'DoR';

  useEffect(() => {
    if (definition.items.length > 0) {
      setItems(definition.items);
    } else {
      setItems([]);
    }
  }, [definition]);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    const newItem = {
      id: `${shortLabel.toLowerCase()}-item-${Date.now()}`,
      description: newItemText.trim(),
      category: newItemCategory,
      isActive: true,
      order: items.length,
    } as T;

    setItems([...items, newItem]);
    setNewItemText('');
    setHasChanges(true);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    setHasChanges(true);
  };

  const handleEditItem = (id: string, description: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, description } : item)));
    setHasChanges(true);
  };

  const handleToggleItem = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item)));
    setHasChanges(true);
  };

  const handleCategoryChange = (id: string, category: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, category } : item)));
    setHasChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    if (temp) {
      newItems[index - 1] = newItems[index]!;
      newItems[index] = temp;
    }
    setItems(newItems.map((item, i) => ({ ...item, order: i })));
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    if (temp) {
      newItems[index + 1] = newItems[index]!;
      newItems[index] = temp;
    }
    setItems(newItems.map((item, i) => ({ ...item, order: i })));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(items);
    setHasChanges(false);
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onCancel();
  };

  const handleDismissDialog = () => {
    setShowCancelDialog(false);
  };

  const infoText =
    definitionType === 'DoD'
      ? 'The Definition of Done is a formal description of the state of the Increment when it meets the quality measures required for the product. Work cannot be considered part of an Increment unless it meets the Definition of Done.'
      : 'The Definition of Ready is a checklist of criteria that a user story must meet before it can be taken into a sprint. It ensures that the team has enough information to complete the work successfully.';

  return (
    <div className={styles['definition-editor']}>
      <div className={styles['definition-editor-header']}>
        <h3>Edit {definitionLabel}</h3>
        <span className={styles['version-badge']}>v{definition.version}</span>
      </div>

      <div className={styles['definition-editor-info']}>
        <p>{infoText}</p>
      </div>

      <div className={styles['definition-add-item']}>
        <div className={styles['add-item-inputs']}>
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className={styles['category-select']}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={`Enter new ${shortLabel} criterion...`}
            className={styles['item-input']}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          />
        </div>
        <button
          className={`${styles.button} ${styles['button-primary']}`}
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          type="button"
          aria-label="Add new item"
        >
          <PlusIcon size={14} />
          Add Item
        </button>
      </div>

      <div className={styles['definition-items-list']}>
        {items.length === 0 ? (
          <div className={styles['empty-state']}>
            <p>No {shortLabel} items yet. Add your first criterion above.</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`${styles['definition-item-row']} ${!item.isActive ? styles['definition-item-row-inactive'] : ''}`}
            >
              <div className={styles['item-order']}>
                <button
                  className={styles['order-button']}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Move up"
                  type="button"
                  aria-label="Move item up"
                >
                  <ArrowUpIcon size={12} />
                </button>
                <span className={styles['order-number']}>{index + 1}</span>
                <button
                  className={styles['order-button']}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1}
                  title="Move down"
                  type="button"
                  aria-label="Move item down"
                >
                  <ArrowDownIcon size={12} />
                </button>
              </div>

              <select
                value={item.category || categories[0]?.value || ''}
                onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                className={styles['item-category']}
                style={getCategoryColor(item.category || categories[0]?.value || '', categories)}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={item.description}
                onChange={(e) => handleEditItem(item.id, e.target.value)}
                className={styles['item-description']}
                aria-label="Item description"
              />

              <div className={styles['item-actions']}>
                <button
                  className={`${styles['toggle-button']} ${item.isActive ? styles['toggle-button-active'] : ''}`}
                  onClick={() => handleToggleItem(item.id)}
                  title={item.isActive ? 'Deactivate' : 'Activate'}
                  type="button"
                  aria-label={item.isActive ? 'Deactivate item' : 'Activate item'}
                  aria-pressed={item.isActive}
                >
                  {item.isActive ? <CheckIcon size={16} /> : <CircleIcon size={16} />}
                </button>
                <button
                  className={styles['remove-button']}
                  onClick={() => handleRemoveItem(item.id)}
                  title="Remove"
                  type="button"
                  aria-label="Remove item"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles['definition-summary']}>
        <span className={styles['active-count-summary']}>
          {items.filter((i) => i.isActive).length} active items
        </span>
        <span className={styles['inactive-count-summary']}>
          {items.filter((i) => !i.isActive).length} inactive
        </span>
      </div>

      <div className={styles['definition-editor-actions']}>
        <button
          className={`${styles.button} ${styles['button-secondary']}`}
          onClick={handleCancelClick}
          disabled={isLoading}
          type="button"
        >
          Cancel
        </button>
        <button
          className={`${styles.button} ${styles['button-primary']}`}
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          type="button"
        >
          {isLoading ? (
            'Saving...'
          ) : (
            <>
              <SaveIcon size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>

      {hasChanges && (
        <div className={styles['unsaved-warning']} role="alert">
          <AlertTriangleIcon size={16} />
          You have unsaved changes
        </div>
      )}

      {showCancelDialog && (
        <div
          className={styles['dialog-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className={styles.dialog}>
            <h4 id="cancel-dialog-title">Discard Changes?</h4>
            <p>You have unsaved changes. Are you sure you want to cancel?</p>
            <div className={styles['dialog-actions']}>
              <button
                className={`${styles.button} ${styles['button-secondary']}`}
                onClick={handleDismissDialog}
                type="button"
              >
                Keep Editing
              </button>
              <button
                className={`${styles.button} ${styles['button-danger']}`}
                onClick={handleConfirmCancel}
                type="button"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

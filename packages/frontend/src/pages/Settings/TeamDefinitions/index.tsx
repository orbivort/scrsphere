import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useTeamStore } from '../../../store';
import { EmptyState } from '../../../components/EmptyState';

import { DefinitionOfReadyPanel, DefinitionOfDonePanel } from './components';
import styles from './TeamDefinitions.module.css';

import { FileTextIcon } from '@/components/common/Icons';

type TabType = 'dor' | 'dod';

export function TeamDefinitionsPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'dod' ? 'dod' : 'dor';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { currentTeam } = useTeamStore();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (!currentTeam) {
    return (
      <div className={styles.page}>
        <EmptyState type="no-team" variant="full-page" />
      </div>
    );
  }

  return (
    <div className={styles.page} data-testid="team-definitions-page">
      <header className={styles.header}>
        <div className={styles['header-content']}>
          <h1 className={styles.title}>
            <span className={styles['title-icon']}>
              <FileTextIcon size={24} />
            </span>
            Team Definitions
          </h1>
          <p className={styles.subtitle}>
            Configure your team&apos;s Definition of Ready and Definition of Done criteria
          </p>
        </div>
      </header>

      <div id="main-content" className={styles['main-content']} tabIndex={-1}>
        <div className={styles.tabs} role="tablist" aria-label="Definition tabs">
          <button
            role="tab"
            aria-selected={activeTab === 'dor'}
            aria-controls="dor-panel"
            id="dor-tab"
            data-tab="dor"
            className={`${styles.tab} ${activeTab === 'dor' ? styles['tab-active'] : ''}`}
            onClick={() => handleTabChange('dor')}
            type="button"
          >
            Definition of Ready
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'dod'}
            aria-controls="dod-panel"
            id="dod-tab"
            data-tab="dod"
            className={`${styles.tab} ${activeTab === 'dod' ? styles['tab-active'] : ''}`}
            onClick={() => handleTabChange('dod')}
            type="button"
          >
            Definition of Done
          </button>
        </div>

        <div
          id="dor-panel"
          role="tabpanel"
          aria-labelledby="dor-tab"
          className={`${styles.panel} ${activeTab === 'dor' ? styles['panel-active'] : ''}`}
          hidden={activeTab !== 'dor'}
        >
          {activeTab === 'dor' && <DefinitionOfReadyPanel />}
        </div>

        <div
          id="dod-panel"
          role="tabpanel"
          aria-labelledby="dod-tab"
          className={`${styles.panel} ${activeTab === 'dod' ? styles['panel-active'] : ''}`}
          hidden={activeTab !== 'dod'}
        >
          {activeTab === 'dod' && <DefinitionOfDonePanel />}
        </div>
      </div>
    </div>
  );
}

export default TeamDefinitionsPage;

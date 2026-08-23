// EventTimebox
//
// A shared, Scrum Guide-correct countdown timebox for the four Scrum events.
// It surfaces the *remaining* time against each event's maximum timebox so the
// Scrum Master can keep the event within its timebox and the team can
// self-manage. The timer never blocks or terminates an event.
//
// Only the Scrum Master can start/pause/reset (matching the Scrum Guide's
// accountability that the SM keeps events within their timebox); all roles can
// view the countdown (Transparency pillar).
//
// The state is persisted server-side and shared across participants; this
// component polls it (refetchInterval) and interpolates locally between polls
// for a smooth second-by-second countdown.
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ScrumEvent } from '@scrumooth/shared';

import { ClockIcon, PlayIcon, SquareIcon, RefreshIcon } from '../Icons';
import { useTeamStore } from '../../../store';
import { queryKeys } from '../../../hooks/queryKeys';
import { timeboxService, type TimeboxQuery } from '../../../services/domain/timebox.service';
import type { TimeboxState } from '../../../types';

import styles from './EventTimebox.module.css';

export interface EventTimeboxProps {
  /** The Scrum event whose timebox to display. */
  event: ScrumEvent;
  /** The Sprint this event belongs to (used to derive the timebox cap). */
  sprintId?: string;
  /** Optional explicit date; defaults to today. */
  date?: string;
  /** Polling interval in milliseconds while the timer is running. Defaults to 30s. */
  pollIntervalMs?: number;
}

/** Format a count of seconds as MM:SS or H:MM:SS. */
const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Split a formatted countdown ("H:MM:SS" / "MM:SS") into segments so the
 * chronometer can be rendered with dimmed colon separators between the
 * digits for a true instrument-style readout.
 */
const splitCountdown = (formatted: string): Array<{ value: string; isSeparator: boolean }> => {
  return formatted.split('').map((ch) => ({
    value: ch,
    isSeparator: ch === ':',
  }));
};

/** Elapsed fraction of the timebox (0..1), clamped for the progress track. */
const elapsedFraction = (elapsedMs: number, timeboxMs: number): number => {
  if (timeboxMs <= 0) return 0;
  return Math.min(1, Math.max(0, elapsedMs / timeboxMs));
};

export const EventTimebox: React.FC<EventTimeboxProps> = ({
  event,
  sprintId,
  date,
  pollIntervalMs = 30_000,
}) => {
  const { t } = useTranslation('timebox');
  // The team store may be a bare mock (returning undefined) in some tests;
  // treat that as "no team context" so the timebox renders in an inert state.
  const teamState = useTeamStore() as {
    currentTeamId?: string | null;
    userRoleInCurrentTeam?: string | null;
  } | null;
  const currentTeamId = teamState?.currentTeamId ?? null;
  const userRoleInCurrentTeam = teamState?.userRoleInCurrentTeam ?? null;
  const queryClient = useQueryClient();

  const isScrumMaster = String(userRoleInCurrentTeam ?? '').toLowerCase() === 'scrum_master';

  // Local wall-clock tick so the countdown updates every second while running.
  const [now, setNow] = useState(() => Date.now());

  // Reference points for local interpolation between server polls.
  const syncAtRef = useRef<number>(Date.now());
  const syncedElapsedRef = useRef<number>(0);

  // The backend scopes a timebox to the active team and requires a `teamId`
  // (via query param on GET, body on control actions) to authorize the request.
  // Other domain services do the same, so we carry `currentTeamId` here too.
  const query: TimeboxQuery = useMemo(
    () => ({ teamId: currentTeamId ?? undefined, sprintId: sprintId ?? undefined, date }),
    [currentTeamId, sprintId, date]
  );

  const queryKey = queryKeys.timebox.get(event, sprintId ?? '', date);

  const { data: state } = useQuery<TimeboxState>({
    queryKey,
    queryFn: () => timeboxService.getTimebox(event, query).then((res) => res.data as TimeboxState),
    enabled: Boolean(currentTeamId),
    refetchInterval: (q) => (q.state.data?.status === 'RUNNING' ? pollIntervalMs : false),
  });

  // Tick locally every second while the timer is running for a smooth display.
  useEffect(() => {
    if (state?.status !== 'RUNNING') {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state?.status]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const startMutation = useMutation({
    mutationFn: () => timeboxService.startTimebox(event, query),
    onSuccess: invalidate,
  });
  const pauseMutation = useMutation({
    mutationFn: () => timeboxService.pauseTimebox(event, query),
    onSuccess: invalidate,
  });
  const resetMutation = useMutation({
    mutationFn: () => timeboxService.resetTimebox(event, query),
    onSuccess: invalidate,
  });

  // Live elapsed time: for a running timer, add the wall-clock time since the
  // last sync point to the server-reported elapsed. Re-anchor the interpolation
  // whenever new server state arrives (detected via the monotonic `version`,
  // which increments on every control action).
  const lastVersionRef = useRef<number | undefined>(undefined);
  if (state && state.version !== lastVersionRef.current) {
    lastVersionRef.current = state.version;
    syncAtRef.current = Date.now();
    syncedElapsedRef.current = state.elapsedMs;
  }

  const liveElapsedMs = useMemo(() => {
    if (!state) return 0;
    if (state.status === 'RUNNING') {
      return syncedElapsedRef.current + (now - syncAtRef.current);
    }
    return state.elapsedMs;
  }, [state, now]);

  const timeboxMs = (state?.timeboxSeconds ?? 0) * 1000;
  const remainingMs = Math.max(0, timeboxMs - liveElapsedMs);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isOvertime = timeboxMs > 0 && liveElapsedMs > timeboxMs;
  const isWarning = !isOvertime && timeboxMs > 0 && remainingMs <= timeboxMs * 0.1;

  const status = state?.status ?? 'IDLE';

  // Accessibility: the timer element itself is a live region
  // (`role="timer"` + `aria-live="polite"` + a changing `aria-label`), so
  // screen readers are informed of remaining time without spamming separate
  // announcements. State is always conveyed by text/icon, never color alone.

  const busy = startMutation.isPending || pauseMutation.isPending || resetMutation.isPending;
  const controlsDisabled = !isScrumMaster || busy;
  // Only the Scrum Master controls the timebox (Scrum Guide accountability).
  // When disabled for anyone else, surface a tooltip so it's clear this is a
  // role restriction rather than a broken control.
  const controlsDisabledReason = !isScrumMaster ? t('aria.smOnly') : undefined;

  const statusLabel = isOvertime
    ? t('status.overtime')
    : status === 'RUNNING'
      ? t('status.running')
      : status === 'PAUSED'
        ? t('status.paused')
        : t('status.idle');

  // Without an active team context the server can't scope (or even create) a
  // timebox, so the query stays disabled. Rendering a plain "00:00" timer here
  // looks broken, so we surface a clear empty state instead of a fake clock.
  if (!currentTeamId) {
    return (
      <div className={styles.timebox} role="timer" aria-live="polite" aria-label={t('aria.noTeam')}>
        <span className={styles.icon} aria-hidden="true">
          <ClockIcon size={16} />
        </span>
        <span className={styles.status}>{t('status.noTeam')}</span>
      </div>
    );
  }

  // Readout shown in overtime is the time *past* the cap ("+M:SS"), otherwise
  // the remaining time. Rendered as segmented digits with dimmed colons.
  const displayCountdown = isOvertime
    ? `+${formatCountdown(Math.abs(liveElapsedMs - timeboxMs) / 1000)}`
    : formatCountdown(remainingSeconds);
  const segments = splitCountdown(displayCountdown);

  // CSS custom property for how much of the timebox has elapsed (progress track).
  const progress = elapsedFraction(liveElapsedMs, timeboxMs);
  const progressStyle = { '--progress': `${progress * 100}%` } as React.CSSProperties;

  const isRunning = status === 'RUNNING';

  return (
    <div
      className={[
        styles.timebox,
        isOvertime ? styles.overtime : isWarning ? styles.warning : '',
        isRunning ? styles.running : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="timer"
      aria-live="polite"
      aria-label={t('aria.timer', { remaining: formatCountdown(remainingSeconds) })}
    >
      <span className={styles.icon} aria-hidden="true">
        <ClockIcon size={16} />
      </span>
      <span className={styles.value}>
        {segments.map((seg, idx) =>
          seg.isSeparator ? (
            <span key={idx} className={styles['value-unit']} aria-hidden="true">
              {seg.value}
            </span>
          ) : (
            <span key={idx}>{seg.value}</span>
          )
        )}
      </span>
      <span className={styles.status}>
        {isRunning && <span className={styles['live-dot']} aria-hidden="true" />}
        {statusLabel}
      </span>
      <span className={styles.progress} aria-hidden="true">
        <span className={styles['progress-fill']} style={progressStyle} />
      </span>

      <span className={styles.controls}>
        {status !== 'RUNNING' ? (
          <button
            type="button"
            className={`${styles['control-button']} ${styles['start-button']}`}
            onClick={() => startMutation.mutate()}
            disabled={controlsDisabled}
            aria-label={t('actions.start')}
            title={controlsDisabledReason}
          >
            <PlayIcon size={14} />
            {t('actions.start')}
          </button>
        ) : (
          <button
            type="button"
            className={`${styles['control-button']} ${styles['pause-button']}`}
            onClick={() => pauseMutation.mutate()}
            disabled={controlsDisabled}
            aria-label={t('actions.pause')}
            title={controlsDisabledReason}
          >
            <SquareIcon size={14} />
            {t('actions.pause')}
          </button>
        )}
        <button
          type="button"
          className={`${styles['control-button']} ${styles['reset-button']}`}
          onClick={() => resetMutation.mutate()}
          disabled={controlsDisabled}
          aria-label={t('actions.reset')}
          title={controlsDisabledReason}
        >
          <RefreshIcon size={14} />
          {t('actions.reset')}
        </button>
      </span>
    </div>
  );
};

export default EventTimebox;

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen, fireEvent, waitFor, act, renderWithProviders } from '@/test-utils';
import userEvent from '@testing-library/user-event';

import { initTestI18n } from '@/test-utils';
import { HealthCheckSurvey } from './HealthCheckSurvey';

// Mock CSS modules
vi.mock('./HealthCheckSurvey.module.css', () => ({
  default: {
    survey: 'survey',
    subtitle: 'subtitle',
    questions: 'questions',
    question: 'question',
    'question-text': 'question-text',
    'value-name': 'value-name',
    'value-question': 'value-question',
    scale: 'scale',
    'score-button': 'score-button',
    selected: 'selected',
    'anonymous-label': 'anonymous-label',
    submit: 'submit',
    saved: 'saved',
  },
}));

// Mock the services module so we can control healthCheckService.submitResponses
const mockSubmitResponses = vi.fn();
vi.mock('../../../services', () => ({
  healthCheckService: {
    submitResponses: (...args: unknown[]) => mockSubmitResponses(...args),
  },
}));

const TEAM_ID = 'team-123';
const HEALTH_CHECK_ID = 'hc-456';

const renderSurvey = (props = {}) =>
  renderWithProviders(
    <HealthCheckSurvey teamId={TEAM_ID} healthCheckId={HEALTH_CHECK_ID} {...props} />
  );

describe('HealthCheckSurvey Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the subtitle and the submit button', () => {
      renderSurvey();

      expect(screen.getByText('Rate each Scrum Value from 1 to 5')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit responses/i })).toBeInTheDocument();
    });

    it('renders a question block for each of the five Scrum Values', () => {
      renderSurvey();

      // Labels come from scrumValues.values.<VALUE>.label
      expect(screen.getByText('Commitment')).toBeInTheDocument();
      expect(screen.getByText('Focus')).toBeInTheDocument();
      expect(screen.getByText('Openness')).toBeInTheDocument();
      expect(screen.getByText('Respect')).toBeInTheDocument();
      expect(screen.getByText('Courage')).toBeInTheDocument();
    });

    it('renders a radiogroup with scores 1-5 for each Scrum Value', () => {
      renderSurvey();

      const radioGroups = screen.getAllByRole('radiogroup');
      expect(radioGroups).toHaveLength(5);

      // Each group should have 5 radio options (scores 1-5)
      radioGroups.forEach((group) => {
        expect(group.querySelectorAll('[role="radio"]')).toHaveLength(5);
      });
    });

    it('renders the anonymous checkbox option', () => {
      renderSurvey();

      expect(screen.getByText('Submit anonymously')).toBeInTheDocument();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Score selection', () => {
    it('marks a score button as selected (aria-checked) when clicked', async () => {
      const user = userEvent.setup();
      renderSurvey();

      const commitmentGroup = screen.getByRole('radiogroup', { name: 'Commitment' });
      const scoreFive = commitmentGroup.querySelectorAll('[role="radio"]')[4];

      await user.click(scoreFive);

      expect(scoreFive).toHaveAttribute('aria-checked', 'true');
    });

    it('updates aria-checked when a different score is chosen', async () => {
      const user = userEvent.setup();
      renderSurvey();

      const commitmentGroup = screen.getByRole('radiogroup', { name: 'Commitment' });
      const radios = commitmentGroup.querySelectorAll('[role="radio"]');

      await user.click(radios[0]);
      expect(radios[0]).toHaveAttribute('aria-checked', 'true');
      expect(radios[1]).toHaveAttribute('aria-checked', 'false');

      await user.click(radios[2]);
      expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Anonymous toggle', () => {
    it('toggles the anonymous flag when the checkbox is clicked', async () => {
      const user = userEvent.setup();
      renderSurvey();

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Submit button enabled state', () => {
    it('disables the submit button until all five values have a score', async () => {
      const user = userEvent.setup();
      renderSurvey();

      const submitButton = screen.getByRole('button', {
        name: /submit responses/i,
      }) as HTMLButtonElement;

      // Initially no scores selected -> disabled
      expect(submitButton).toBeDisabled();

      // Select a score for each of the 5 Scrum Values
      const groups = screen.getAllByRole('radiogroup');
      for (const group of groups) {
        const radios = group.querySelectorAll('[role="radio"]');
        await user.click(radios[2]); // pick score 3
      }

      expect(submitButton).not.toBeDisabled();
    });

    it('shows the loading label while the mutation is pending', async () => {
      // Keep the mutation pending to assert the loading state
      let resolveMutation!: (value: unknown) => void;
      mockSubmitResponses.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveMutation = resolve;
          })
      );

      const user = userEvent.setup();
      renderSurvey();

      // Select scores for all values
      const groups = screen.getAllByRole('radiogroup');
      for (const group of groups) {
        const radios = group.querySelectorAll('[role="radio"]');
        await user.click(radios[0]);
      }

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      await waitFor(() => expect(screen.getByText(/loading/i)).toBeInTheDocument());
      expect(submitButton).toBeDisabled();

      await act(async () => {
        resolveMutation(undefined);
      });
    });
  });

  describe('Submission success', () => {
    it('calls submitResponses with one payload per Scrum Value using selected scores', async () => {
      const user = userEvent.setup();
      mockSubmitResponses.mockResolvedValue({
        data: { healthCheckId: HEALTH_CHECK_ID, saved: [] },
      });

      renderSurvey();

      // Pick score 4 for every value
      const groups = screen.getAllByRole('radiogroup');
      for (const group of groups) {
        const radios = group.querySelectorAll('[role="radio"]');
        await user.click(radios[3]);
      }

      await user.click(screen.getByRole('button', { name: /submit responses/i }));

      await waitFor(() =>
        expect(mockSubmitResponses).toHaveBeenCalledWith(
          HEALTH_CHECK_ID,
          expect.arrayContaining([
            { scrumValue: 'COMMITMENT', score: 4, anonymous: false },
            { scrumValue: 'FOCUS', score: 4, anonymous: false },
            { scrumValue: 'OPENNESS', score: 4, anonymous: false },
            { scrumValue: 'RESPECT', score: 4, anonymous: false },
            { scrumValue: 'COURAGE', score: 4, anonymous: false },
          ])
        )
      );
    });

    it('includes the anonymous flag when the checkbox is checked', async () => {
      const user = userEvent.setup();
      mockSubmitResponses.mockResolvedValue({
        data: { healthCheckId: HEALTH_CHECK_ID, saved: [] },
      });

      renderSurvey();

      await user.click(screen.getByRole('checkbox'));

      const groups = screen.getAllByRole('radiogroup');
      for (const group of groups) {
        const radios = group.querySelectorAll('[role="radio"]');
        await user.click(radios[1]); // score 2
      }

      await user.click(screen.getByRole('button', { name: /submit responses/i }));

      await waitFor(() =>
        expect(mockSubmitResponses).toHaveBeenCalledWith(
          HEALTH_CHECK_ID,
          expect.arrayContaining([{ scrumValue: 'COMMITMENT', score: 2, anonymous: true }])
        )
      );
    });

    it('keeps the submit button disabled when only some values are scored', async () => {
      const user = userEvent.setup();
      renderSurvey();

      // Select a score for only the first value (Commitment)
      const firstGroup = screen.getAllByRole('radiogroup')[0];
      await user.click(firstGroup.querySelectorAll('[role="radio"]')[4]); // score 5

      const submitButton = screen.getByRole('button', {
        name: /submit responses/i,
      }) as HTMLButtonElement;

      expect(submitButton).toBeDisabled();
      expect(mockSubmitResponses).not.toHaveBeenCalled();
    });

    it('renders the success message after a successful submission', async () => {
      const user = userEvent.setup();
      mockSubmitResponses.mockResolvedValue({
        data: { healthCheckId: HEALTH_CHECK_ID, saved: [] },
      });

      renderSurvey();

      const groups = screen.getAllByRole('radiogroup');
      for (const group of groups) {
        const radios = group.querySelectorAll('[role="radio"]');
        await user.click(radios[2]);
      }

      await user.click(screen.getByRole('button', { name: /submit responses/i }));

      expect(await screen.findByText('Responses submitted. Thank you!')).toBeInTheDocument();
      // Form is replaced by the saved confirmation
      expect(screen.queryByRole('button', { name: /submit responses/i })).not.toBeInTheDocument();
    });
  });

  describe('Submission error', () => {
    it('surfaces a toast error when submitResponses rejects', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockSubmitResponses.mockRejectedValue(new Error('network failure'));

      renderSurvey();

      const groups = screen.getAllByRole('radiogroup');
      for (const group of groups) {
        const radios = group.querySelectorAll('[role="radio"]');
        await user.click(radios[2]);
      }

      await user.click(screen.getByRole('button', { name: /submit responses/i }));

      // The mutation error is logged via the onError handler
      await waitFor(() => expect(mockSubmitResponses).toHaveBeenCalled());
      // Component should stay on the form so the user can retry
      expect(screen.getByRole('button', { name: /submit responses/i })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Form submit event', () => {
    it('submits when the form is submitted (e.g. via Enter), not only via button click', async () => {
      mockSubmitResponses.mockResolvedValue({
        data: { healthCheckId: HEALTH_CHECK_ID, saved: [] },
      });

      renderSurvey();

      const groups = screen.getAllByRole('radiogroup');
      for (const group of groups) {
        const radios = group.querySelectorAll('[role="radio"]');
        fireEvent.click(radios[0]);
      }

      fireEvent.submit(screen.getByRole('button', { name: /submit responses/i }).closest('form')!);

      await waitFor(() => expect(mockSubmitResponses).toHaveBeenCalled());
    });
  });
});

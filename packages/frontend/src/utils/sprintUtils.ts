export type SprintTimeCategory = 'current' | 'future' | 'past';

export const getSprintTimeCategory = (startDate: string, endDate: string): SprintTimeCategory => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now >= start && now <= end) {
    return 'current';
  } else if (now < start) {
    return 'future';
  } else {
    return 'past';
  }
};

export const formatSprintOptionLabel = (sprint: {
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  category: SprintTimeCategory;
}): string => {
  const categoryIcon =
    sprint.category === 'current' ? '🔄' : sprint.category === 'future' ? '📅' : '✓';
  const statusDisplay =
    sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1).toLowerCase();
  return `${categoryIcon} ${sprint.name} (${statusDisplay})`;
};

export const calculateSprintDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let businessDays = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return businessDays;
};

export const getRecommendedPlanningTime = (startDate: string, endDate: string): number => {
  const days = calculateSprintDuration(startDate, endDate);
  const weeks = Math.ceil(days / 7);
  return weeks * 2 * 60 * 60;
};

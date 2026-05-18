import { getDaysBetween } from './date.helper';

/**
 * Checks if a given date is a pure revision/buffer day for a specific exam date.
 * Typically, the 1-2 days right before the exam are dedicated to pure revision.
 */
export function isPureRevisionDay(currentDate: Date, examDate: Date): boolean {
  const daysRemaining = getDaysBetween(currentDate, examDate);
  // 1 or 2 days before the exam are pure revision/buffer days
  return daysRemaining > 0 && daysRemaining <= 2;
}

/**
 * Checks if a given date is the day before the exam, where a lighter schedule is required.
 */
export function isDayBeforeExam(currentDate: Date, examDate: Date): boolean {
  const daysRemaining = getDaysBetween(currentDate, examDate);
  return daysRemaining === 1;
}

/**
 * Adjusts study hours for the day before the exam to keep the workload light.
 */
export function getLighterStudyHours(dailyStudyHours: number): number {
  // Lighter schedule before exam day (e.g., 50% of regular study hours, minimum 1 hour)
  return Math.max(1, Math.round(dailyStudyHours * 0.5));
}

/**
 * Generates an automatic revision task for a subject based on chapters already covered.
 */
export function getRevisionTaskForSubject(subject: string, chaptersCovered: string[]): {
  subject: string;
  chapter: string;
  type: 'Revision' | 'Learning';
} {
  if (chaptersCovered.length === 0) {
    return {
      subject,
      chapter: 'General Review',
      type: 'Revision',
    };
  }

  // Pick a chapter from the covered chapters list (cycling or random)
  const randomIndex = Math.floor(Math.random() * chaptersCovered.length);
  const chapterToRevise = chaptersCovered[randomIndex];

  return {
    subject,
    chapter: `Revision: ${chapterToRevise}`,
    type: 'Revision',
  };
}

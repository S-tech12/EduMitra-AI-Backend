import { 
  formatDateString, 
  parseDateString, 
  getTodayMidnight, 
  addDays, 
  getDaysBetween, 
  getDayName 
} from './date.helper';
import { 
  isPureRevisionDay, 
  isDayBeforeExam, 
  getLighterStudyHours, 
  getRevisionTaskForSubject 
} from './revision.helper';
import { SubjectScheduleInput, TimetableGenerationInput } from './validation.helper';

export interface TimetableTask {
  subject: string;
  chapter: string;
  time: string;
  type: 'Learning' | 'Revision' | 'Exam';
}

export interface TimetableDay {
  date: string;
  day: string;
  tasks: TimetableTask[];
}

/**
 * Distributes chapters for a subject evenly across its available learning days.
 */
function distributeChapters(
  chapters: string[], 
  learningDaysCount: number
): string[][] {
  const distribution: string[][] = Array.from({ length: learningDaysCount }, () => []);
  
  if (chapters.length === 0 || learningDaysCount === 0) {
    return distribution;
  }

  // Spreading chapters evenly
  // If we have more days than chapters, space them out
  // If we have fewer days, we have multiple chapters per day
  if (learningDaysCount >= chapters.length) {
    // Space out: E.g., 6 days and 3 chapters -> 1 chapter every 2 days
    const interval = learningDaysCount / chapters.length;
    chapters.forEach((chapter, index) => {
      const dayIndex = Math.min(
        learningDaysCount - 1,
        Math.floor(index * interval)
      );
      distribution[dayIndex].push(chapter);
    });
  } else {
    // Dense: E.g., 2 days and 5 chapters -> 3 chapters on Day 1, 2 chapters on Day 2
    chapters.forEach((chapter, index) => {
      const dayIndex = index % learningDaysCount;
      distribution[dayIndex].push(chapter);
    });
  }

  return distribution;
}

/**
 * Format minutes since midnight into a clean 12-hour AM/PM string.
 * Example: 960 -> "04:00 PM"
 */
function formatTime12H(minutesSinceMidnight: number): string {
  const hours24 = Math.floor(minutesSinceMidnight / 60) % 24;
  const minutes = minutesSinceMidnight % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutesStr = String(minutes).padStart(2, '0');
  const hoursStr = String(hours12).padStart(2, '0');
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

/**
 * The core smart timetable generation algorithm.
 */
export function generateSmartTimetable(input: TimetableGenerationInput): TimetableDay[] {
  const today = getTodayMidnight();
  
  // Filter active valid subjects
  const activeSubjects = input.subjects.filter(
    (s) => s.subject && s.date && s.selectedChapters && s.selectedChapters.length > 0
  );

  if (activeSubjects.length === 0) {
    return [];
  }

  // Find the latest exam date to determine the scope of the timetable
  let latestExamDate = today;
  activeSubjects.forEach((sub) => {
    const examDate = parseDateString(sub.date);
    if (examDate.getTime() > latestExamDate.getTime()) {
      latestExamDate = examDate;
    }
  });

  // Calculate total schedule days (from today until the latest exam date)
  const totalDays = getDaysBetween(today, latestExamDate) + 1;
  const scheduleDays: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    scheduleDays.push(addDays(today, i));
  }

  // Pre-calculate chapter distribution for each subject
  const subjectSchedules = activeSubjects.map((sub) => {
    const examDate = parseDateString(sub.date);
    const prepDaysCount = getDaysBetween(today, examDate); // days before exam

    // Reserve pure revision days (1 or 2 days before exam, or 0 if very short time)
    const revisionDaysCount = prepDaysCount > 2 ? 2 : prepDaysCount > 0 ? 1 : 0;
    const learningDaysCount = Math.max(0, prepDaysCount - revisionDaysCount);

    const chapterDistribution = distributeChapters(sub.selectedChapters, learningDaysCount);

    return {
      ...sub,
      examDate,
      prepDaysCount,
      revisionDaysCount,
      learningDaysCount,
      chapterDistribution,
      chaptersCoveredSoFar: [] as string[],
    };
  });

  const timetable: TimetableDay[] = [];

  // Generate day-by-day
  scheduleDays.forEach((currentDate) => {
    const dateStr = formatDateString(currentDate);
    const dayName = getDayName(currentDate);
    const tasks: TimetableTask[] = [];

    // 1. Check for Exams on this day
    const examsToday = subjectSchedules.filter(
      (sub) => formatDateString(sub.examDate) === dateStr
    );

    examsToday.forEach((exam) => {
      // Parse exam start time (e.g., "10:00" or "10:00 AM")
      // Calculate typical 3-hour duration for GSEB board exam
      let timeString = exam.time;
      if (exam.time.includes(':') && !exam.time.includes('AM') && !exam.time.includes('PM')) {
        const [h, m] = exam.time.split(':').map(Number);
        const startMin = h * 60 + m;
        const endMin = startMin + 180; // 3 hours
        timeString = `${formatTime12H(startMin)} - ${formatTime12H(endMin)}`;
      }

      tasks.push({
        subject: exam.subject,
        chapter: 'BOARD EXAM DAY 📝',
        time: timeString,
        type: 'Exam',
      });
    });

    // 2. Schedule study tasks for active subjects (exams in the future)
    const activeSubjectsForDay = subjectSchedules.filter(
      (sub) => currentDate.getTime() < sub.examDate.getTime()
    );

    if (activeSubjectsForDay.length > 0) {
      // Prioritize subjects with earlier exams
      activeSubjectsForDay.sort((a, b) => a.examDate.getTime() - b.examDate.getTime());

      // Determine daily study hour limit for this day
      // Apply lighter workload rules if any subject has an exam tomorrow
      const hasExamTomorrow = activeSubjectsForDay.some((sub) =>
        isDayBeforeExam(currentDate, sub.examDate)
      );

      const baseStudyHours = Number(input.studyHours);
      const allowedStudyHours = hasExamTomorrow
        ? getLighterStudyHours(baseStudyHours)
        : baseStudyHours;

      // Allocate study sessions
      // We will create tasks based on:
      // - Is it a pure revision day for the subject?
      // - Do we have chapters scheduled for learning?
      const dailyStudyBlocks: { subject: string; chapter: string; type: 'Learning' | 'Revision'; durationMin: number }[] = [];

      activeSubjectsForDay.forEach((sub) => {
        const daysSinceStart = getDaysBetween(today, currentDate);
        const isRevDay = isPureRevisionDay(currentDate, sub.examDate);

        if (isRevDay) {
          // Schedule a dedicated Revision session
          dailyStudyBlocks.push({
            subject: sub.subject,
            chapter: 'Syllabus Revision & Mock Test Practice',
            type: 'Revision',
            durationMin: 60, // 1 hour revision
          });
        } else if (daysSinceStart < sub.learningDaysCount) {
          // It's a learning day, get scheduled chapters
          const chaptersToday = sub.chapterDistribution[daysSinceStart] || [];
          chaptersToday.forEach((chapter) => {
            dailyStudyBlocks.push({
              subject: sub.subject,
              chapter,
              type: 'Learning',
              durationMin: 90, // 1.5 hours deep work
            });
            // Track covered chapters for future spaced revision
            if (!sub.chaptersCoveredSoFar.includes(chapter)) {
              sub.chaptersCoveredSoFar.push(chapter);
            }
          });

          // Add a minor automatic revision task if chapters are covered
          if (sub.chaptersCoveredSoFar.length > 0 && Math.random() > 0.4) {
            const rev = getRevisionTaskForSubject(sub.subject, sub.chaptersCoveredSoFar);
            dailyStudyBlocks.push({
              subject: rev.subject,
              chapter: rev.chapter,
              type: 'Revision',
              durationMin: 45, // 45 min review
            });
          }
        } else {
          // Fallback: Buffer day before the dedicated revision days
          dailyStudyBlocks.push({
            subject: sub.subject,
            chapter: 'Topic Consolidation & Active Recall',
            type: 'Revision',
            durationMin: 60,
          });
        }
      });

      // Format time slots avoiding school timings
      let timeCursor = 10 * 60; // Default starts at 10:00 AM

      if (input.hasSchool === 'Yes' && input.schoolEndTime) {
        const [endH, endM] = input.schoolEndTime.split(':').map(Number);
        // Start 2 hours after school ends to allow for rest/lunch
        timeCursor = endH * 60 + endM + 120;
      }

      // Respect daily study hour limits
      let allocatedMinutes = 0;
      const maxMinutes = allowedStudyHours * 60;

      dailyStudyBlocks.forEach((block) => {
        if (allocatedMinutes + block.durationMin <= maxMinutes) {
          const startTimeStr = formatTime12H(timeCursor);
          const endTimeStr = formatTime12H(timeCursor + block.durationMin);

          tasks.push({
            subject: block.subject,
            chapter: block.chapter,
            time: `${startTimeStr} - ${endTimeStr}`,
            type: block.type,
          });

          allocatedMinutes += block.durationMin;
          // Add a 15-minute transition/break between sessions
          timeCursor += block.durationMin + 15;
        }
      });

      // If we couldn't schedule any blocks because of strict timing or no chapters,
      // create a lightweight fallback session
      if (tasks.length === 0 && activeSubjectsForDay.length > 0) {
        const primarySub = activeSubjectsForDay[0];
        const startTimeStr = formatTime12H(timeCursor);
        const endTimeStr = formatTime12H(timeCursor + 60);

        tasks.push({
          subject: primarySub.subject,
          chapter: 'Syllabus Review & Formulas Recall',
          time: `${startTimeStr} - ${endTimeStr}`,
          type: 'Revision',
        });
      }
    }

    timetable.push({
      date: dateStr,
      day: dayName,
      tasks,
    });
  });

  return timetable;
}

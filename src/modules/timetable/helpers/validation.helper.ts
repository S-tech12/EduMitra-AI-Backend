import { BadRequestException } from '@nestjs/common';
import { isValidExamDate } from './date.helper';

export interface SubjectScheduleInput {
  subject: string;
  date: string;
  time: string;
  selectedChapters: string[];
}

export interface TimetableGenerationInput {
  subjects: SubjectScheduleInput[];
  studyHours: number | string;
  hasSchool: string; // 'Yes' | 'No'
  schoolStartTime?: string;
  schoolEndTime?: string;
}

/**
 * Validates the timetable generation inputs based on the business rules.
 * Throws a BadRequestException if validation fails with descriptive errors.
 */
export function validateTimetableInput(input: TimetableGenerationInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // RULE 3: Empty Form Prevention
  if (!input) {
    errors.push('No form data provided.');
    return { isValid: false, errors };
  }

  // Filter out any rows that are completely empty
  const activeSubjects = (input.subjects || []).filter(
    (s) => s.subject || s.date || s.time || (s.selectedChapters && s.selectedChapters.length > 0)
  );

  if (activeSubjects.length === 0) {
    errors.push('Please select at least one subject with exam details.');
    return { isValid: false, errors };
  }

  // RULE 4: Daily study hours validation
  const hours = Number(input.studyHours);
  if (!input.studyHours || isNaN(hours) || hours <= 0 || hours > 16) {
    errors.push('Daily study hours is required and must be between 1 and 16 hours.');
  }

  // RULE 5: Prevent duplicate subjects
  const subjectNames = activeSubjects.map((s) => s.subject.trim().toLowerCase()).filter(Boolean);
  const uniqueSubjects = new Set(subjectNames);
  if (uniqueSubjects.size !== subjectNames.length) {
    errors.push('Duplicate subjects are not allowed. Please remove repeating subjects.');
  }

  // Validate each active subject schedule
  activeSubjects.forEach((sub, idx) => {
    const subLabel = sub.subject ? `"${sub.subject}"` : `Subject at row ${idx + 1}`;

    // Validate Subject Name presence
    if (!sub.subject || !sub.subject.trim()) {
      errors.push(`Subject name is required for row ${idx + 1}.`);
    }

    // RULE 1: Exam Date validation
    if (!sub.date) {
      errors.push(`Exam date is required for ${subLabel}.`);
    } else {
      const dateValidation = isValidExamDate(sub.date);
      if (!dateValidation.isValid) {
        errors.push(`Exam date for ${subLabel}: ${dateValidation.reason}`);
      }
    }

    // Exam Time presence
    if (!sub.time) {
      errors.push(`Exam time is required for ${subLabel}.`);
    }

    // RULE 2: Chapter Selection required
    if (!sub.selectedChapters || sub.selectedChapters.length === 0) {
      errors.push(`At least 1 chapter must be selected for ${subLabel}.`);
    }
  });

  // Validate School Timings if applicable
  if (input.hasSchool === 'Yes') {
    if (!input.schoolStartTime || !input.schoolEndTime) {
      errors.push('School start time and end time are required when school is active.');
    } else {
      const [startH, startM] = input.schoolStartTime.split(':').map(Number);
      const [endH, endM] = input.schoolEndTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        errors.push('School End Time must be strictly after School Start Time.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

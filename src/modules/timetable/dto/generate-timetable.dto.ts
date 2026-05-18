import { 
  IsArray, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectScheduleDto {
  @IsString()
  @IsNotEmpty({ message: 'Subject name is required' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Exam date is required' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: 'Exam time is required' })
  time: string;

  @IsArray({ message: 'Chapters must be provided as an array' })
  @IsString({ each: true, message: 'Each chapter name must be a string' })
  selectedChapters: string[];
}

export class GenerateTimetableDto {
  @IsString()
  @IsNotEmpty({ message: 'Timetable name is required' })
  timetableName: string;

  @IsArray({ message: 'Subjects schedule must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SubjectScheduleDto)
  subjects: SubjectScheduleDto[];

  @IsNotEmpty({ message: 'Daily study hours is required' })
  studyHours: number | string;

  @IsString()
  @IsNotEmpty({ message: 'School attendance selection is required' })
  hasSchool: string;

  @IsString()
  @IsOptional()
  schoolStartTime?: string;

  @IsString()
  @IsOptional()
  schoolEndTime?: string;
}

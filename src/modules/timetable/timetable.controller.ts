import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Body, 
  UseGuards, 
  Req, 
  NotFoundException, 
  BadRequestException,
  Param
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { GenerateTimetableDto } from './dto/generate-timetable.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('timetable')
@UseGuards(JwtAuthGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  /**
   * Protected POST route to generate a personalized smart study timetable.
   */
  @Post('generate')
  async generate(@Req() req: any, @Body() generateTimetableDto: GenerateTimetableDto) {
    try {
      const userId = req.user.userId;
      const timetable = await this.timetableService.generate(userId, generateTimetableDto);

      return {
        success: true,
        message: 'Smart study timetable generated successfully!',
        data: { timetable },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'An unexpected error occurred during generation.');
    }
  }

  /**
   * Protected GET route to retrieve the student's latest active timetable.
   */
  @Get('latest')
  async getLatest(@Req() req: any) {
    const userId = req.user.userId;
    const timetable = await this.timetableService.getLatest(userId);

    if (!timetable) {
      return {
        success: true,
        message: 'No timetable generated yet.',
        data: { timetable: null },
      };
    }

    return {
      success: true,
      data: { timetable },
    };
  }

  /**
   * Protected GET route to retrieve all active (unexpired) timetables for a student.
   */
  @Get()
  async getAll(@Req() req: any) {
    const userId = req.user.userId;
    const timetables = await this.timetableService.findAll(userId);
    return {
      success: true,
      data: { timetables },
    };
  }

  /**
   * Protected GET route to retrieve a specific timetable by ID.
   */
  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    try {
      const timetable = await this.timetableService.findOne(userId, id);
      return {
        success: true,
        data: { timetable },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Timetable not found.');
    }
  }

  /**
   * Protected PATCH route to toggle task completion in a specific timetable.
   */
  @Patch(':id/task/toggle')
  async toggleTaskById(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { date: string; subject: string; chapter: string }
  ) {
    const userId = req.user.userId;
    const { date, subject, chapter } = body;

    if (!date || !subject || !chapter) {
      throw new BadRequestException('Date, subject, and chapter are required to toggle completion.');
    }

    try {
      const updatedTimetable = await this.timetableService.toggleTaskCompletion(
        userId,
        id,
        date,
        subject,
        chapter
      );

      return {
        success: true,
        message: 'Task progress toggled successfully.',
        data: { timetable: updatedTimetable },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to toggle task progress.');
    }
  }

  /**
   * Protected PATCH route to toggle task completion on the LATEST active timetable.
   */
  @Patch('task/toggle')
  async toggleTask(
    @Req() req: any, 
    @Body() body: { date: string; subject: string; chapter: string }
  ) {
    const userId = req.user.userId;
    const { date, subject, chapter } = body;

    if (!date || !subject || !chapter) {
      throw new BadRequestException('Date, subject, and chapter are required to toggle completion.');
    }

    try {
      // Find latest timetable to get its ID
      const latest = await this.timetableService.getLatest(userId);
      if (!latest) {
        throw new BadRequestException('No active timetable found.');
      }

      const updatedTimetable = await this.timetableService.toggleTaskCompletion(
        userId,
        latest._id.toString(),
        date,
        subject,
        chapter
      );

      return {
        success: true,
        message: 'Task progress toggled successfully.',
        data: { timetable: updatedTimetable },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to toggle task progress.');
    }
  }
}

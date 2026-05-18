import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { Timetable, TimetableSchema } from './schemas/timetable.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Timetable.name, schema: TimetableSchema }]),
  ],
  controllers: [TimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}

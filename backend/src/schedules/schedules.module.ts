import { Module } from '@nestjs/common';
import { TrainSchedulesModule } from '../train-schedules/train-schedules.module';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [TrainSchedulesModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}

import { Module } from '@nestjs/common';
import { TrainSchedulesController } from './train-schedules.controller';
import { TrainSchedulesService } from './train-schedules.service';

@Module({
  controllers: [TrainSchedulesController],
  providers: [TrainSchedulesService],
})
export class TrainSchedulesModule {}

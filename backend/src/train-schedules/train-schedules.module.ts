import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { TrainSchedulesController } from './train-schedules.controller';
import { TrainSchedulesService } from './train-schedules.service';

@Module({
  imports: [RealtimeModule],
  controllers: [TrainSchedulesController],
  providers: [TrainSchedulesService],
  exports: [TrainSchedulesService],
})
export class TrainSchedulesModule {}

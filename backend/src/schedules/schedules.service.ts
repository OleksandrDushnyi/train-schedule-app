import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryTrainSchedulesDto } from '../train-schedules/dto/query-train-schedules.dto';
import type { TrainScheduleWithRoute } from '../train-schedules/interfaces';
import { TrainSchedulesService } from '../train-schedules/train-schedules.service';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trainSchedulesService: TrainSchedulesService,
  ) {}

  findAll(query: QueryTrainSchedulesDto): Promise<TrainScheduleWithRoute[]> {
    return this.trainSchedulesService.findAll(query);
  }

  findOne(id: string): Promise<TrainScheduleWithRoute> {
    return this.trainSchedulesService.findOne(id);
  }

  findAvailableFilters() {
    return Promise.all([
      this.prisma.route.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.station.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      }),
    ]).then(([routes, stations]) => ({ routes, stations }));
  }
}

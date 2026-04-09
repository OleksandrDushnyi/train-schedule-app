import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SCHEDULE_FILTERS_CACHE_KEY } from '../redis/redis.constants';
import { RedisService } from '../redis/redis.service';
import type { QueryTrainSchedulesDto } from '../train-schedules/dto/query-train-schedules.dto';
import type { TrainScheduleWithRoute } from '../train-schedules/interfaces';
import { TrainSchedulesService } from '../train-schedules/train-schedules.service';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trainSchedulesService: TrainSchedulesService,
    private readonly redis: RedisService,
  ) {}

  findAll(query: QueryTrainSchedulesDto): Promise<TrainScheduleWithRoute[]> {
    return this.trainSchedulesService.findAll(query);
  }

  findOne(id: string): Promise<TrainScheduleWithRoute> {
    return this.trainSchedulesService.findOne(id);
  }

  async findAvailableFilters(): Promise<{
    routes: { id: string; name: string }[];
    stations: { id: string; name: string; code: string | null }[];
  }> {
    if (this.redis.isEnabled()) {
      const cached = await this.redis.getString(SCHEDULE_FILTERS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as {
          routes: { id: string; name: string }[];
          stations: { id: string; name: string; code: string | null }[];
        };
      }
    }

    const [routes, stations] = await Promise.all([
      this.prisma.route.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.station.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      }),
    ]);
    const payload = { routes, stations };

    if (this.redis.isEnabled()) {
      await this.redis.setString(
        SCHEDULE_FILTERS_CACHE_KEY,
        JSON.stringify(payload),
        this.redis.scheduleFiltersCacheTtlSeconds(),
      );
    }

    return payload;
  }
}

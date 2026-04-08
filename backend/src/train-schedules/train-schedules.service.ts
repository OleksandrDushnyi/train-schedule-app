import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTrainScheduleDto } from './dto/create-train-schedule.dto';
import type { QueryTrainSchedulesDto } from './dto/query-train-schedules.dto';
import type { UpdateTrainScheduleDto } from './dto/update-train-schedule.dto';
import { scheduleInclude } from './train-schedules.constants';

@Injectable()
export class TrainSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTrainScheduleDto) {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return this.prisma.trainSchedule.create({
      data: {
        routeId: dto.routeId,
        departureAt: new Date(dto.departureAt),
        trainNumber: dto.trainNumber.trim(),
        trainType: dto.trainType,
      },
      include: scheduleInclude,
    });
  }

  findAll(query: QueryTrainSchedulesDto) {
    return this.prisma.trainSchedule.findMany({
      where: query.routeId ? { routeId: query.routeId } : undefined,
      orderBy: { departureAt: 'asc' },
      include: scheduleInclude,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.trainSchedule.findUnique({
      where: { id },
      include: scheduleInclude,
    });
    if (!row) {
      throw new NotFoundException('Train schedule not found');
    }
    return row;
  }

  async update(id: string, dto: UpdateTrainScheduleDto) {
    await this.findOne(id);
    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: dto.routeId },
      });
      if (!route) {
        throw new NotFoundException('Route not found');
      }
    }
    return this.prisma.trainSchedule.update({
      where: { id },
      data: {
        ...(dto.routeId !== undefined && { routeId: dto.routeId }),
        ...(dto.departureAt !== undefined && {
          departureAt: new Date(dto.departureAt),
        }),
        ...(dto.trainNumber !== undefined && {
          trainNumber: dto.trainNumber.trim(),
        }),
        ...(dto.trainType !== undefined && { trainType: dto.trainType }),
      },
      include: scheduleInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.trainSchedule.delete({ where: { id } });
  }
}

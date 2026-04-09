import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { CreateStationDto } from './dto/create-station.dto';
import type { UpdateStationDto } from './dto/update-station.dto';

@Injectable()
export class StationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateStationDto) {
    try {
      const created = await this.prisma.station.create({
        data: {
          name: dto.name.trim(),
          code: dto.code?.trim() || null,
        },
      });
      await this.redis.invalidateScheduleFiltersCache();
      return created;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Station with this code already exists');
      }
      throw e;
    }
  }

  findAll() {
    return this.prisma.station.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const station = await this.prisma.station.findUnique({ where: { id } });
    if (!station) {
      throw new NotFoundException('Station not found');
    }
    return station;
  }

  async update(id: string, dto: UpdateStationDto) {
    await this.findOne(id);
    try {
      const updated = await this.prisma.station.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.code !== undefined && { code: dto.code.trim() || null }),
        },
      });
      await this.redis.invalidateScheduleFiltersCache();
      return updated;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Station with this code already exists');
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      const deleted = await this.prisma.station.delete({ where: { id } });
      await this.redis.invalidateScheduleFiltersCache();
      return deleted;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException('Station is used on a route');
      }
      throw e;
    }
  }
}

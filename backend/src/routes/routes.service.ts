import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRouteStopDto } from './dto/create-route-stop.dto';
import type { CreateRouteDto } from './dto/create-route.dto';
import type { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import type { UpdateRouteDto } from './dto/update-route.dto';
import type { RouteWithStops } from './interfaces/route-with-stops.interface';
import { routeInclude } from './routes.constants';

export type { RouteWithStops } from './interfaces/route-with-stops.interface';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRouteDto): Promise<RouteWithStops> {
    return this.prisma.route.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
      include: routeInclude,
    });
  }

  findAll(): Promise<RouteWithStops[]> {
    return this.prisma.route.findMany({
      orderBy: { name: 'asc' },
      include: routeInclude,
    });
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: routeInclude,
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return route;
  }

  async update(id: string, dto: UpdateRouteDto) {
    await this.findOne(id);
    return this.prisma.route.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
      },
      include: routeInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.route.delete({
      where: { id },
    });
  }

  async addStop(routeId: string, dto: CreateRouteStopDto) {
    await this.findOne(routeId);
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });
    if (!station) {
      throw new NotFoundException('Station not found');
    }
    try {
      return await this.prisma.routeStop.create({
        data: {
          routeId,
          stationId: dto.stationId,
          sequence: dto.sequence,
          minutesFromStart: dto.minutesFromStart,
        },
        include: { station: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'This sequence is already used on this route',
        );
      }
      throw e;
    }
  }

  async updateStop(routeId: string, stopId: string, dto: UpdateRouteStopDto) {
    await this.findOne(routeId);
    const existing = await this.prisma.routeStop.findFirst({
      where: { id: stopId, routeId },
    });
    if (!existing) {
      throw new NotFoundException('Route stop not found');
    }
    try {
      return await this.prisma.routeStop.update({
        where: { id: stopId },
        data: {
          ...(dto.sequence !== undefined && { sequence: dto.sequence }),
          ...(dto.minutesFromStart !== undefined && {
            minutesFromStart: dto.minutesFromStart,
          }),
        },
        include: { station: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'This sequence is already used on this route',
        );
      }
      throw e;
    }
  }

  async removeStop(routeId: string, stopId: string) {
    await this.findOne(routeId);
    const existing = await this.prisma.routeStop.findFirst({
      where: { id: stopId, routeId },
    });
    if (!existing) {
      throw new NotFoundException('Route stop not found');
    }
    return this.prisma.routeStop.delete({ where: { id: stopId } });
  }
}

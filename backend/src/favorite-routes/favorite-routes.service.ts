import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { routeInclude } from '../routes/routes.constants';
import type { CreateFavoriteRouteDto } from './dto/create-favorite-route.dto';
import type { FavoriteRouteWithRoute } from './interfaces';

@Injectable()
export class FavoriteRoutesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string): Promise<FavoriteRouteWithRoute[]> {
    return this.prisma.favoriteRoute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        route: {
          include: routeInclude,
        },
      },
    });
  }

  async create(
    userId: string,
    dto: CreateFavoriteRouteDto,
  ): Promise<FavoriteRouteWithRoute> {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    try {
      return await this.prisma.favoriteRoute.create({
        data: {
          userId,
          routeId: dto.routeId,
        },
        include: {
          route: {
            include: routeInclude,
          },
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Route is already in favorites');
      }
      throw e;
    }
  }

  async remove(userId: string, routeId: string): Promise<{ ok: true }> {
    const favorite = await this.prisma.favoriteRoute.findUnique({
      where: {
        userId_routeId: {
          userId,
          routeId,
        },
      },
    });
    if (!favorite) {
      throw new NotFoundException('Favorite route not found');
    }

    await this.prisma.favoriteRoute.delete({
      where: { id: favorite.id },
    });
    return { ok: true };
  }
}

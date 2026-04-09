import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FavoriteRoutesService } from '../../src/favorite-routes/favorite-routes.service';

describe('FavoriteRoutesService', () => {
  const prisma = {
    route: {
      findUnique: jest.fn(),
    },
    favoriteRoute: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: FavoriteRoutesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FavoriteRoutesService(prisma as never);
  });

  it('throws not found when adding favorite for missing route', async () => {
    prisma.route.findUnique.mockResolvedValue(null);

    await expect(
      service.create('user-1', { routeId: 'route-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws conflict when route is already in favorites', async () => {
    prisma.route.findUnique.mockResolvedValue({ id: 'route-1' });
    prisma.favoriteRoute.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate favorite', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.create('user-1', { routeId: 'route-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns ok when favorite route is removed', async () => {
    prisma.favoriteRoute.findUnique.mockResolvedValue({ id: 'fav-1' });
    prisma.favoriteRoute.delete.mockResolvedValue({ id: 'fav-1' });

    await expect(service.remove('user-1', 'route-1')).resolves.toEqual({
      ok: true,
    });
  });
});

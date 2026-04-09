import { SchedulesService } from '../../src/schedules/schedules.service';

describe('SchedulesService', () => {
  const prisma = {
    route: {
      findMany: jest.fn(),
    },
    station: {
      findMany: jest.fn(),
    },
  };

  const trainSchedulesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  let service: SchedulesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SchedulesService(
      prisma as never,
      trainSchedulesService as never,
    );
  });

  it('delegates schedule list to TrainSchedulesService', async () => {
    const result = [{ id: 'schedule-1' }];
    trainSchedulesService.findAll.mockResolvedValue(result);

    await expect(service.findAll({ routeId: 'route-1' })).resolves.toBe(result);
    expect(trainSchedulesService.findAll).toHaveBeenCalledWith({
      routeId: 'route-1',
    });
  });

  it('returns available route and station filters', async () => {
    prisma.route.findMany.mockResolvedValue([
      { id: 'route-1', name: 'Kyiv - Lviv' },
    ]);
    prisma.station.findMany.mockResolvedValue([
      { id: 'station-1', name: 'Kyiv', code: 'KYIV' },
    ]);

    await expect(service.findAvailableFilters()).resolves.toEqual({
      routes: [{ id: 'route-1', name: 'Kyiv - Lviv' }],
      stations: [{ id: 'station-1', name: 'Kyiv', code: 'KYIV' }],
    });
  });
});

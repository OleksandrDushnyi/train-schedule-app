import { NotFoundException } from '@nestjs/common';
import { TrainSchedulesService } from '../../src/train-schedules/train-schedules.service';

describe('TrainSchedulesService', () => {
  const prisma = {
    route: {
      findUnique: jest.fn(),
    },
    trainSchedule: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const realtimeGateway = {
    emitTrainScheduleCreated: jest.fn(),
    emitTrainScheduleUpdated: jest.fn(),
    emitTrainScheduleDeleted: jest.fn(),
  };

  let service: TrainSchedulesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrainSchedulesService(
      prisma as never,
      realtimeGateway as never,
    );
  });

  it('emits created event after schedule creation', async () => {
    const created = {
      id: 'schedule-1',
      routeId: 'route-1',
      route: { id: 'route-1', stops: [] },
    };
    prisma.route.findUnique.mockResolvedValue({ id: 'route-1' });
    prisma.trainSchedule.create.mockResolvedValue(created);

    await expect(
      service.create({
        routeId: 'route-1',
        departureAt: '2026-04-10T08:30:00.000Z',
        trainNumber: '743K',
        trainType: 'REGIONAL',
      }),
    ).resolves.toBe(created);
    expect(realtimeGateway.emitTrainScheduleCreated).toHaveBeenCalledWith(
      created,
    );
  });

  it('emits deleted event after schedule deletion', async () => {
    prisma.trainSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      routeId: 'route-1',
      route: { id: 'route-1', stops: [] },
    });
    prisma.trainSchedule.delete.mockResolvedValue({
      id: 'schedule-1',
      routeId: 'route-1',
    });

    await expect(service.remove('schedule-1')).resolves.toEqual({
      id: 'schedule-1',
      routeId: 'route-1',
    });
    expect(realtimeGateway.emitTrainScheduleDeleted).toHaveBeenCalledWith({
      id: 'schedule-1',
      routeId: 'route-1',
    });
  });

  it('throws when creating schedule for missing route', async () => {
    prisma.route.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        routeId: 'route-404',
        departureAt: '2026-04-10T08:30:00.000Z',
        trainNumber: '743K',
        trainType: 'REGIONAL',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

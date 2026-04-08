import type { RouteWithStops } from '../../routes/interfaces';

export interface TrainScheduleWithRoute {
  id: string;
  routeId: string;
  departureAt: Date;
  trainNumber: string;
  trainType: 'EXPRESS' | 'REGIONAL' | 'SUBURBAN' | 'INTERCITY';
  createdAt: Date;
  updatedAt: Date;
  route: RouteWithStops;
}

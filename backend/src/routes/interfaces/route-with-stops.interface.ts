import type { RouteStopWithStation } from './route-stop-with-station.interface';

export interface RouteWithStops {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  stops: RouteStopWithStation[];
}

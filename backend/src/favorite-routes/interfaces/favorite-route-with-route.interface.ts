import type { RouteWithStops } from '../../routes/interfaces';

export interface FavoriteRouteWithRoute {
  id: string;
  userId: string;
  routeId: string;
  createdAt: Date;
  route: RouteWithStops;
}

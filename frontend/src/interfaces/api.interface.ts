import type { Role, TrainType } from '../types/app.type';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  id: string;
  email: string;
  role: Role;
}

export interface SessionData extends TokenPair {
  user: UserPublic;
}

export interface Station {
  id: string;
  name: string;
  code: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RouteStopWithStation {
  id: string;
  routeId: string;
  stationId: string;
  sequence: number;
  minutesFromStart: number;
  station: Station;
}

export interface RouteWithStops {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  stops: RouteStopWithStation[];
}

export interface TrainScheduleWithRoute {
  id: string;
  routeId: string;
  departureAt: string;
  trainNumber: string;
  trainType: TrainType;
  createdAt: string;
  updatedAt: string;
  route: RouteWithStops;
}

export interface FavoriteRouteWithRoute {
  id: string;
  userId: string;
  routeId: string;
  createdAt: string;
  route: RouteWithStops;
}

export interface ScheduleFiltersResponse {
  routes: Array<Pick<RouteWithStops, 'id' | 'name'>>;
  stations: Array<Pick<Station, 'id' | 'name' | 'code'>>;
}

export interface ApiErrorPayload {
  statusCode?: number;
  message?: string | string[];
  path?: string;
  timestamp?: string;
}

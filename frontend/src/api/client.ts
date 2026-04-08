import type {
  ApiErrorPayload,
  FavoriteRouteWithRoute,
  RouteStopWithStation,
  RouteWithStops,
  ScheduleFiltersResponse,
  Station,
  TokenPair,
  TrainScheduleWithRoute,
  UserPublic,
} from '../interfaces/api.interface';
import type { TrainType } from '../types/app.type';

const base = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly payload?: ApiErrorPayload;

  constructor(status: number, payload?: ApiErrorPayload) {
    super(readMessage(payload) ?? `Request failed with status ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

function readMessage(payload?: ApiErrorPayload): string | undefined {
  if (payload?.message === undefined) {
    return undefined;
  }
  return Array.isArray(payload.message)
    ? payload.message.join(', ')
    : payload.message;
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${p}`;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, value);
    }
  }
  const result = query.toString();
  return result.length > 0 ? `?${result}` : '';
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (token !== undefined) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  const text = await response.text();
  const payload = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorPayload | undefined);
  }

  return payload as T;
}

export const authApi = {
  login(email: string, password: string): Promise<TokenPair> {
    return request<TokenPair>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register(email: string, password: string): Promise<TokenPair> {
    return request<TokenPair>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  refresh(refreshToken: string): Promise<TokenPair> {
    return request<TokenPair>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  logout(refreshToken: string): Promise<{ ok: true }> {
    return request<{ ok: true }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  me(accessToken: string): Promise<UserPublic> {
    return request<UserPublic>('/api/auth/me', {}, accessToken);
  },
};

export const schedulesApi = {
  list(
    token: string,
    params: {
      date?: string;
      routeId?: string;
      trainType?: TrainType | '';
    },
  ): Promise<TrainScheduleWithRoute[]> {
    return request<TrainScheduleWithRoute[]>(
      `/api/schedules${buildQuery({
        date: params.date,
        routeId: params.routeId,
        trainType: params.trainType || undefined,
      })}`,
      {},
      token,
    );
  },
  filters(token: string): Promise<ScheduleFiltersResponse> {
    return request<ScheduleFiltersResponse>('/api/schedules/filters', {}, token);
  },
  getById(id: string, token: string): Promise<TrainScheduleWithRoute> {
    return request<TrainScheduleWithRoute>(`/api/schedules/${id}`, {}, token);
  },
};

export const favoriteRoutesApi = {
  list(token: string): Promise<FavoriteRouteWithRoute[]> {
    return request<FavoriteRouteWithRoute[]>('/api/favorite-routes', {}, token);
  },
  create(routeId: string, token: string): Promise<FavoriteRouteWithRoute> {
    return request<FavoriteRouteWithRoute>(
      '/api/favorite-routes',
      {
        method: 'POST',
        body: JSON.stringify({ routeId }),
      },
      token,
    );
  },
  remove(routeId: string, token: string): Promise<{ ok: true }> {
    return request<{ ok: true }>(
      `/api/favorite-routes/${routeId}`,
      { method: 'DELETE' },
      token,
    );
  },
};

export const adminApi = {
  listStations(token: string): Promise<Station[]> {
    return request<Station[]>('/api/admin/stations', {}, token);
  },
  createStation(
    token: string,
    payload: { name: string; code?: string },
  ): Promise<Station> {
    return request<Station>(
      '/api/admin/stations',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  updateStation(
    token: string,
    id: string,
    payload: { name?: string; code?: string },
  ): Promise<Station> {
    return request<Station>(
      `/api/admin/stations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  deleteStation(token: string, id: string): Promise<Station> {
    return request<Station>(`/api/admin/stations/${id}`, { method: 'DELETE' }, token);
  },
  listRoutes(token: string): Promise<RouteWithStops[]> {
    return request<RouteWithStops[]>('/api/admin/routes', {}, token);
  },
  createRoute(
    token: string,
    payload: { name: string; description?: string },
  ): Promise<RouteWithStops> {
    return request<RouteWithStops>(
      '/api/admin/routes',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  updateRoute(
    token: string,
    id: string,
    payload: { name?: string; description?: string },
  ): Promise<RouteWithStops> {
    return request<RouteWithStops>(
      `/api/admin/routes/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  deleteRoute(token: string, id: string): Promise<RouteWithStops> {
    return request<RouteWithStops>(`/api/admin/routes/${id}`, { method: 'DELETE' }, token);
  },
  addRouteStop(
    token: string,
    routeId: string,
    payload: { stationId: string; sequence: number; minutesFromStart: number },
  ): Promise<RouteStopWithStation> {
    return request<RouteStopWithStation>(
      `/api/admin/routes/${routeId}/stops`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  updateRouteStop(
    token: string,
    routeId: string,
    stopId: string,
    payload: { sequence?: number; minutesFromStart?: number },
  ): Promise<RouteStopWithStation> {
    return request<RouteStopWithStation>(
      `/api/admin/routes/${routeId}/stops/${stopId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  deleteRouteStop(
    token: string,
    routeId: string,
    stopId: string,
  ): Promise<RouteStopWithStation> {
    return request<RouteStopWithStation>(
      `/api/admin/routes/${routeId}/stops/${stopId}`,
      { method: 'DELETE' },
      token,
    );
  },
  listTrainSchedules(
    token: string,
    params: { routeId?: string } = {},
  ): Promise<TrainScheduleWithRoute[]> {
    return request<TrainScheduleWithRoute[]>(
      `/api/admin/train-schedules${buildQuery({ routeId: params.routeId })}`,
      {},
      token,
    );
  },
  createTrainSchedule(
    token: string,
    payload: {
      routeId: string;
      departureAt: string;
      trainNumber: string;
      trainType: TrainType;
    },
  ): Promise<TrainScheduleWithRoute> {
    return request<TrainScheduleWithRoute>(
      '/api/admin/train-schedules',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  updateTrainSchedule(
    token: string,
    id: string,
    payload: {
      routeId?: string;
      departureAt?: string;
      trainNumber?: string;
      trainType?: TrainType;
    },
  ): Promise<TrainScheduleWithRoute> {
    return request<TrainScheduleWithRoute>(
      `/api/admin/train-schedules/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    );
  },
  deleteTrainSchedule(token: string, id: string): Promise<TrainScheduleWithRoute> {
    return request<TrainScheduleWithRoute>(
      `/api/admin/train-schedules/${id}`,
      { method: 'DELETE' },
      token,
    );
  },
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import {
  adminApi,
  ApiError,
  authApi,
  favoriteRoutesApi,
  schedulesApi,
} from './api/client';
import type {
  FavoriteRouteWithRoute,
  RouteStopWithStation,
  RouteWithStops,
  ScheduleFiltersResponse,
  SessionData,
  Station,
  TrainScheduleWithRoute,
} from './interfaces/api.interface';
import type { AuthMode, DashboardTab, TrainType } from './types/app.type';

const STORAGE_KEY = 'train-schedule-session';
const TRAIN_TYPES: TrainType[] = [
  'EXPRESS',
  'REGIONAL',
  'SUBURBAN',
  'INTERCITY',
];

const emptyStationForm = { id: '', name: '', code: '' };
const emptyRouteForm = { id: '', name: '', description: '' };
const emptyStopForm = {
  id: '',
  stationId: '',
  sequence: '1',
  minutesFromStart: '0',
};
const emptyScheduleForm = {
  id: '',
  routeId: '',
  departureAt: '',
  trainNumber: '',
  trainType: 'REGIONAL' as TrainType,
};
const initialSearchFilters = {
  date: '',
  routeId: '',
  trainType: '' as TrainType | '',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toLocalInputValue(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatStopTime(schedule: TrainScheduleWithRoute, stop: RouteStopWithStation) {
  const departure = new Date(schedule.departureAt);
  departure.setMinutes(departure.getMinutes() + stop.minutesFromStart);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(departure);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error';
}

function App() {
  const sessionRef = useRef<SessionData | null>(null);

  const [isBooting, setIsBooting] = useState(true);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [tab, setTab] = useState<DashboardTab>('search');
  const [session, setSession] = useState<SessionData | null>(null);
  const [authForm, setAuthForm] = useState({
    email: 'user@demo.train',
    password: 'User123!',
  });
  const [searchFilters, setSearchFilters] = useState(initialSearchFilters);
  const [scheduleFilters, setScheduleFilters] =
    useState<ScheduleFiltersResponse | null>(null);
  const [schedules, setSchedules] = useState<TrainScheduleWithRoute[]>([]);
  const [selectedSchedule, setSelectedSchedule] =
    useState<TrainScheduleWithRoute | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRouteWithRoute[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [adminSchedules, setAdminSchedules] = useState<TrainScheduleWithRoute[]>([]);
  const [selectedAdminRouteId, setSelectedAdminRouteId] = useState('');
  const [stationForm, setStationForm] = useState(emptyStationForm);
  const [routeForm, setRouteForm] = useState(emptyRouteForm);
  const [stopForm, setStopForm] = useState(emptyStopForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);

  sessionRef.current = session;

  const favoriteRouteIds = useMemo(
    () => new Set(favorites.map((item) => item.routeId)),
    [favorites],
  );
  const selectedAdminRoute =
    routes.find((route) => route.id === selectedAdminRouteId) ?? null;

  const persistSession = useCallback((next: SessionData | null) => {
    setSession(next);
    sessionRef.current = next;
    if (next === null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const withAuth = useCallback(async <T,>(fn: (accessToken: string) => Promise<T>): Promise<T> => {
    const current = sessionRef.current;
    if (current === null) {
      throw new Error('Please sign in first');
    }

    try {
      return await fn(current.accessToken);
    } catch (errorValue) {
      if (
        errorValue instanceof ApiError &&
        errorValue.status === 401 &&
        current.refreshToken.length > 0
      ) {
        const nextTokens = await authApi.refresh(current.refreshToken);
        const nextUser = await authApi.me(nextTokens.accessToken);
        const nextSession: SessionData = {
          ...nextTokens,
          user: nextUser,
        };
        persistSession(nextSession);
        return fn(nextSession.accessToken);
      }
      throw errorValue;
    }
  }, [persistSession]);

  async function loadSchedules(currentFilters = searchFilters) {
    const nextSchedules = await withAuth((token) =>
      schedulesApi.list(token, currentFilters),
    );
    setSchedules(nextSchedules);
    if (nextSchedules.length === 0) {
      setSelectedSchedule(null);
      return;
    }

    const currentSelected = selectedSchedule?.id;
    const selectedFromList =
      nextSchedules.find((item) => item.id === currentSelected) ?? nextSchedules[0];
    setSelectedSchedule(selectedFromList);
  }

  async function refreshAdminCollections() {
    const [nextStations, nextRoutes, nextAdminSchedules] = await Promise.all([
      withAuth((token) => adminApi.listStations(token)),
      withAuth((token) => adminApi.listRoutes(token)),
      withAuth((token) => adminApi.listTrainSchedules(token)),
    ]);

    setStations(nextStations);
    setRoutes(nextRoutes);
    setAdminSchedules(nextAdminSchedules);
    setSelectedAdminRouteId((current) => {
      const selected =
        nextRoutes.find((route) => route.id === current)?.id ?? nextRoutes[0]?.id;
      return selected ?? '';
    });
    setStopForm((current) => ({
      ...current,
      stationId: current.stationId || nextStations[0]?.id || '',
    }));
    setScheduleForm((current) => ({
      ...current,
      routeId: current.routeId || nextRoutes[0]?.id || '',
    }));
  }

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      setIsBooting(false);
      return;
    }

    void (async () => {
      try {
        const saved = JSON.parse(raw) as SessionData;
        const nextUser = await authApi.me(saved.accessToken);
        persistSession({ ...saved, user: nextUser });
      } catch {
        try {
          const saved = JSON.parse(raw) as SessionData;
          const nextTokens = await authApi.refresh(saved.refreshToken);
          const nextUser = await authApi.me(nextTokens.accessToken);
          persistSession({ ...nextTokens, user: nextUser });
        } catch {
          persistSession(null);
        }
      } finally {
        setIsBooting(false);
      }
    })();
  }, [persistSession]);

  useEffect(() => {
    if (session === null) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setBusyLabel('Loading dashboard...');
      setError(null);
      try {
        const [nextFilters, nextFavorites, nextSchedules] = await Promise.all([
          withAuth((token) => schedulesApi.filters(token)),
          withAuth((token) => favoriteRoutesApi.list(token)),
          withAuth((token) => schedulesApi.list(token, initialSearchFilters)),
        ]);

        if (cancelled) {
          return;
        }

        setScheduleFilters(nextFilters);
        setFavorites(nextFavorites);
        setSchedules(nextSchedules);
        setSelectedSchedule((current) => {
          if (nextSchedules.length === 0) {
            return null;
          }
          return (
            nextSchedules.find((item) => item.id === current?.id) ?? nextSchedules[0]
          );
        });

        if (session.user.role === 'ADMIN') {
          const [nextStations, nextRoutes, nextAdminSchedules] = await Promise.all([
            withAuth((token) => adminApi.listStations(token)),
            withAuth((token) => adminApi.listRoutes(token)),
            withAuth((token) => adminApi.listTrainSchedules(token)),
          ]);

          if (cancelled) {
            return;
          }

          setStations(nextStations);
          setRoutes(nextRoutes);
          setAdminSchedules(nextAdminSchedules);
          setSelectedAdminRouteId((current) => {
            const selected =
              nextRoutes.find((route) => route.id === current)?.id ?? nextRoutes[0]?.id;
            return selected ?? '';
          });
          setStopForm((current) => ({
            ...current,
            stationId: current.stationId || nextStations[0]?.id || '',
          }));
          setScheduleForm((current) => ({
            ...current,
            routeId: current.routeId || nextRoutes[0]?.id || '',
          }));
        }
      } catch (errorValue) {
        if (!cancelled) {
          setError(getErrorMessage(errorValue));
        }
      } finally {
        if (!cancelled) {
          setBusyLabel(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, persistSession, withAuth]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyLabel(authMode === 'login' ? 'Signing in...' : 'Creating account...');
    setError(null);
    setNotice(null);
    try {
      const tokens =
        authMode === 'login'
          ? await authApi.login(authForm.email, authForm.password)
          : await authApi.register(authForm.email, authForm.password);
      const user = await authApi.me(tokens.accessToken);
      persistSession({ ...tokens, user });
      setNotice(authMode === 'login' ? 'Signed in successfully.' : 'Account created.');
      setTab(user.role === 'ADMIN' ? 'admin' : 'search');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleLogout() {
    const current = sessionRef.current;
    persistSession(null);
    setFavorites([]);
    setSchedules([]);
    setSelectedSchedule(null);
    setStations([]);
    setRoutes([]);
    setAdminSchedules([]);
    setNotice('You have been signed out.');

    if (current !== null) {
      try {
        await authApi.logout(current.refreshToken);
      } catch {
        // best effort
      }
    }
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyLabel('Searching schedules...');
    setError(null);
    try {
      await loadSchedules(searchFilters);
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleSelectSchedule(scheduleId: string) {
    setBusyLabel('Loading train details...');
    setError(null);
    try {
      const schedule = await withAuth((token) => schedulesApi.getById(scheduleId, token));
      setSelectedSchedule(schedule);
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function refreshFavorites() {
    const nextFavorites = await withAuth((token) => favoriteRoutesApi.list(token));
    setFavorites(nextFavorites);
  }

  async function toggleFavorite(routeId: string) {
    setBusyLabel('Updating favorites...');
    setError(null);
    try {
      if (favoriteRouteIds.has(routeId)) {
        await withAuth((token) => favoriteRoutesApi.remove(routeId, token));
        setNotice('Route removed from favorites.');
      } else {
        await withAuth((token) => favoriteRoutesApi.create(routeId, token));
        setNotice('Route saved to favorites.');
      }
      await refreshFavorites();
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleStationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyLabel(stationForm.id ? 'Updating station...' : 'Creating station...');
    setError(null);
    try {
      await withAuth((token) =>
        stationForm.id
          ? adminApi.updateStation(token, stationForm.id, {
              name: stationForm.name,
              code: stationForm.code || undefined,
            })
          : adminApi.createStation(token, {
              name: stationForm.name,
              code: stationForm.code || undefined,
            }),
      );
      setStationForm(emptyStationForm);
      await refreshAdminCollections();
      setNotice(stationForm.id ? 'Station updated.' : 'Station created.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleDeleteStation(id: string) {
    if (!window.confirm('Delete this station?')) {
      return;
    }
    setBusyLabel('Deleting station...');
    setError(null);
    try {
      await withAuth((token) => adminApi.deleteStation(token, id));
      await refreshAdminCollections();
      setNotice('Station deleted.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleRouteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyLabel(routeForm.id ? 'Updating route...' : 'Creating route...');
    setError(null);
    try {
      await withAuth((token) =>
        routeForm.id
          ? adminApi.updateRoute(token, routeForm.id, {
              name: routeForm.name,
              description: routeForm.description || undefined,
            })
          : adminApi.createRoute(token, {
              name: routeForm.name,
              description: routeForm.description || undefined,
            }),
      );
      setRouteForm(emptyRouteForm);
      await refreshAdminCollections();
      setNotice(routeForm.id ? 'Route updated.' : 'Route created.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleDeleteRoute(id: string) {
    if (!window.confirm('Delete this route and all linked data?')) {
      return;
    }
    setBusyLabel('Deleting route...');
    setError(null);
    try {
      await withAuth((token) => adminApi.deleteRoute(token, id));
      await refreshAdminCollections();
      setNotice('Route deleted.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleStopSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedAdminRouteId.length === 0) {
      setError('Choose a route first.');
      return;
    }
    setBusyLabel(stopForm.id ? 'Updating stop...' : 'Adding stop...');
    setError(null);
    try {
      await withAuth((token) =>
        stopForm.id
          ? adminApi.updateRouteStop(token, selectedAdminRouteId, stopForm.id, {
              sequence: Number(stopForm.sequence),
              minutesFromStart: Number(stopForm.minutesFromStart),
            })
          : adminApi.addRouteStop(token, selectedAdminRouteId, {
              stationId: stopForm.stationId,
              sequence: Number(stopForm.sequence),
              minutesFromStart: Number(stopForm.minutesFromStart),
            }),
      );
      setStopForm({
        ...emptyStopForm,
        stationId: stations[0]?.id || '',
      });
      await refreshAdminCollections();
      setNotice(stopForm.id ? 'Route stop updated.' : 'Route stop added.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleDeleteStop(stopId: string) {
    if (selectedAdminRouteId.length === 0 || !window.confirm('Delete this stop?')) {
      return;
    }
    setBusyLabel('Deleting stop...');
    setError(null);
    try {
      await withAuth((token) =>
        adminApi.deleteRouteStop(token, selectedAdminRouteId, stopId),
      );
      await refreshAdminCollections();
      setNotice('Route stop deleted.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyLabel(scheduleForm.id ? 'Updating departure...' : 'Creating departure...');
    setError(null);
    try {
      const payload = {
        routeId: scheduleForm.routeId,
        departureAt: new Date(scheduleForm.departureAt).toISOString(),
        trainNumber: scheduleForm.trainNumber,
        trainType: scheduleForm.trainType,
      };
      await withAuth((token) =>
        scheduleForm.id
          ? adminApi.updateTrainSchedule(token, scheduleForm.id, payload)
          : adminApi.createTrainSchedule(token, payload),
      );
      setScheduleForm({
        ...emptyScheduleForm,
        routeId: routes[0]?.id || '',
      });
      await refreshAdminCollections();
      await loadSchedules();
      setNotice(scheduleForm.id ? 'Departure updated.' : 'Departure created.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  async function handleDeleteAdminSchedule(id: string) {
    if (!window.confirm('Delete this departure?')) {
      return;
    }
    setBusyLabel('Deleting departure...');
    setError(null);
    try {
      await withAuth((token) => adminApi.deleteTrainSchedule(token, id));
      await refreshAdminCollections();
      await loadSchedules();
      setNotice('Departure deleted.');
    } catch (errorValue) {
      setError(getErrorMessage(errorValue));
    } finally {
      setBusyLabel(null);
    }
  }

  if (isBooting) {
    return (
      <div className="app app--centered">
        <div className="card">
          <h1 className="app__title">Train Schedule App</h1>
          <p className="muted">Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="app auth-layout">
        <div className="auth-hero">
          <h1 className="app__title">Train Schedule App</h1>
          <p className="app__subtitle">
            Sign in to browse schedules, filter departures, and save favorite routes.
          </p>
          <div className="demo-box">
            <h2>Demo accounts</h2>
            <p>
              <strong>Admin:</strong> admin@demo.train / Admin123!
            </p>
            <p>
              <strong>User:</strong> user@demo.train / User123!
            </p>
          </div>
        </div>

        <form className="card auth-card" onSubmit={handleAuthSubmit}>
          <div className="segmented">
            <button
              className={authMode === 'login' ? 'is-active' : ''}
              onClick={() => setAuthMode('login')}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'is-active' : ''}
              onClick={() => setAuthMode('register')}
              type="button"
            >
              Register
            </button>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              required
              type="email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              minLength={6}
              required
              type="password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>

          {error && <p className="status status--error">{error}</p>}
          {notice && <p className="status status--success">{notice}</p>}

          <button className="button button--primary" disabled={busyLabel !== null} type="submit">
            {busyLabel ?? (authMode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">Train Schedule App</h1>
          <p className="app__subtitle">
            Search trains, view details, and manage schedules with one simple interface.
          </p>
        </div>
        <div className="header-actions">
          <div className="user-pill">
            <strong>{session.user.email}</strong>
            <span>{session.user.role}</span>
          </div>
          <button className="button" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <main className="app__main">
        <nav className="tabs">
          <button
            className={tab === 'search' ? 'is-active' : ''}
            onClick={() => setTab('search')}
            type="button"
          >
            Search
          </button>
          <button
            className={tab === 'favorites' ? 'is-active' : ''}
            onClick={() => setTab('favorites')}
            type="button"
          >
            Favorites
          </button>
          {session.user.role === 'ADMIN' && (
            <button
              className={tab === 'admin' ? 'is-active' : ''}
              onClick={() => setTab('admin')}
              type="button"
            >
              Admin
            </button>
          )}
        </nav>

        {busyLabel && <p className="status status--info">{busyLabel}</p>}
        {error && <p className="status status--error">{error}</p>}
        {notice && <p className="status status--success">{notice}</p>}

        {tab === 'search' && (
          <section className="layout-grid">
            <div className="card">
              <h2>Browse schedules</h2>
              <form className="search-grid" onSubmit={handleSearchSubmit}>
                <label className="field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={searchFilters.date}
                    onChange={(event) =>
                      setSearchFilters((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Route</span>
                  <select
                    value={searchFilters.routeId}
                    onChange={(event) =>
                      setSearchFilters((current) => ({
                        ...current,
                        routeId: event.target.value,
                      }))
                    }
                  >
                    <option value="">All routes</option>
                    {scheduleFilters?.routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Train type</span>
                  <select
                    value={searchFilters.trainType}
                    onChange={(event) =>
                      setSearchFilters((current) => ({
                        ...current,
                        trainType: event.target.value as TrainType | '',
                      }))
                    }
                  >
                    <option value="">All types</option>
                    {TRAIN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button button--primary" type="submit">
                  Search
                </button>
              </form>

              <div className="stats-row">
                <span>{schedules.length} departures found</span>
                <span>{scheduleFilters?.stations.length ?? 0} stations available</span>
              </div>

              <div className="list">
                {schedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    className={`list-card ${
                      selectedSchedule?.id === schedule.id ? 'is-selected' : ''
                    }`}
                    onClick={() => void handleSelectSchedule(schedule.id)}
                    type="button"
                  >
                    <div className="list-card__head">
                      <strong>{schedule.route.name}</strong>
                      <span>{schedule.trainType}</span>
                    </div>
                    <div className="list-card__meta">
                      <span>Train {schedule.trainNumber}</span>
                      <span>{formatDateTime(schedule.departureAt)}</span>
                    </div>
                  </button>
                ))}
                {schedules.length === 0 && (
                  <p className="empty-state">No schedules match the selected filters.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h2>Train details</h2>
              {selectedSchedule ? (
                <>
                  <div className="detail-summary">
                    <div>
                      <p className="eyebrow">Route</p>
                      <h3>{selectedSchedule.route.name}</h3>
                    </div>
                    <button
                      className="button"
                      onClick={() => void toggleFavorite(selectedSchedule.route.id)}
                      type="button"
                    >
                      {favoriteRouteIds.has(selectedSchedule.route.id)
                        ? 'Remove favorite'
                        : 'Save favorite'}
                    </button>
                  </div>
                  <p className="muted">
                    Train {selectedSchedule.trainNumber} · {selectedSchedule.trainType}
                  </p>
                  <p className="muted">
                    Departure: {formatDateTime(selectedSchedule.departureAt)}
                  </p>
                  {selectedSchedule.route.description && (
                    <p className="muted">{selectedSchedule.route.description}</p>
                  )}
                  <div className="timeline">
                    {selectedSchedule.route.stops.map((stop) => (
                      <div className="timeline__item" key={stop.id}>
                        <div>
                          <strong>{stop.station.name}</strong>
                          <p className="muted">
                            {stop.station.code ?? 'No code'} · stop #{stop.sequence}
                          </p>
                        </div>
                        <strong>{formatStopTime(selectedSchedule, stop)}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="empty-state">Choose a departure to see full train details.</p>
              )}
            </div>
          </section>
        )}

        {tab === 'favorites' && (
          <section className="card">
            <h2>Favorite routes</h2>
            <div className="list">
              {favorites.map((favorite) => (
                <div className="list-card" key={favorite.id}>
                  <div className="list-card__head">
                    <strong>{favorite.route.name}</strong>
                    <button
                      className="button"
                      onClick={() => void toggleFavorite(favorite.routeId)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="muted">
                    Added {formatDateTime(favorite.createdAt)} · {favorite.route.stops.length} stops
                  </p>
                  {favorite.route.description && (
                    <p className="muted">{favorite.route.description}</p>
                  )}
                </div>
              ))}
              {favorites.length === 0 && (
                <p className="empty-state">
                  No favorites yet. Open a train detail card and save a route for quick access.
                </p>
              )}
            </div>
          </section>
        )}

        {tab === 'admin' && session.user.role === 'ADMIN' && (
          <section className="admin-grid">
            <div className="card">
              <h2>Stations</h2>
              <form className="stack" onSubmit={handleStationSubmit}>
                <label className="field">
                  <span>Name</span>
                  <input
                    required
                    value={stationForm.name}
                    onChange={(event) =>
                      setStationForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Code</span>
                  <input
                    value={stationForm.code}
                    onChange={(event) =>
                      setStationForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="inline-actions">
                  <button className="button button--primary" type="submit">
                    {stationForm.id ? 'Update station' : 'Create station'}
                  </button>
                  {stationForm.id && (
                    <button
                      className="button"
                      onClick={() => setStationForm(emptyStationForm)}
                      type="button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              <div className="list list--compact">
                {stations.map((station) => (
                  <div className="list-card" key={station.id}>
                    <div className="list-card__head">
                      <strong>{station.name}</strong>
                      <span>{station.code ?? 'No code'}</span>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="button"
                        onClick={() =>
                          setStationForm({
                            id: station.id,
                            name: station.name,
                            code: station.code ?? '',
                          })
                        }
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="button button--danger"
                        onClick={() => void handleDeleteStation(station.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Routes</h2>
              <form className="stack" onSubmit={handleRouteSubmit}>
                <label className="field">
                  <span>Name</span>
                  <input
                    required
                    value={routeForm.name}
                    onChange={(event) =>
                      setRouteForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={routeForm.description}
                    onChange={(event) =>
                      setRouteForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="inline-actions">
                  <button className="button button--primary" type="submit">
                    {routeForm.id ? 'Update route' : 'Create route'}
                  </button>
                  {routeForm.id && (
                    <button
                      className="button"
                      onClick={() => setRouteForm(emptyRouteForm)}
                      type="button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="list list--compact">
                {routes.map((route) => (
                  <div className="list-card" key={route.id}>
                    <div className="list-card__head">
                      <button
                        className="link-button"
                        onClick={() => setSelectedAdminRouteId(route.id)}
                        type="button"
                      >
                        {route.name}
                      </button>
                      <span>{route.stops.length} stops</span>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="button"
                        onClick={() =>
                          setRouteForm({
                            id: route.id,
                            name: route.name,
                            description: route.description ?? '',
                          })
                        }
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="button button--danger"
                        onClick={() => void handleDeleteRoute(route.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Route stops</h2>
              {selectedAdminRoute ? (
                <>
                  <p className="muted">
                    Editing stops for <strong>{selectedAdminRoute.name}</strong>
                  </p>
                  <form className="stack" onSubmit={handleStopSubmit}>
                    <label className="field">
                      <span>Station</span>
                      <select
                        required
                        value={stopForm.stationId}
                        onChange={(event) =>
                          setStopForm((current) => ({
                            ...current,
                            stationId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choose station</option>
                        {stations.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Sequence</span>
                      <input
                        min="1"
                        required
                        type="number"
                        value={stopForm.sequence}
                        onChange={(event) =>
                          setStopForm((current) => ({
                            ...current,
                            sequence: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Minutes from start</span>
                      <input
                        min="0"
                        required
                        type="number"
                        value={stopForm.minutesFromStart}
                        onChange={(event) =>
                          setStopForm((current) => ({
                            ...current,
                            minutesFromStart: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="inline-actions">
                      <button className="button button--primary" type="submit">
                        {stopForm.id ? 'Update stop' : 'Add stop'}
                      </button>
                      {stopForm.id && (
                        <button
                          className="button"
                          onClick={() =>
                            setStopForm({
                              ...emptyStopForm,
                              stationId: stations[0]?.id ?? '',
                            })
                          }
                          type="button"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                  <div className="list list--compact">
                    {selectedAdminRoute.stops.map((stop) => (
                      <div className="list-card" key={stop.id}>
                        <div className="list-card__head">
                          <strong>
                            #{stop.sequence} {stop.station.name}
                          </strong>
                          <span>{stop.minutesFromStart} min</span>
                        </div>
                        <div className="inline-actions">
                          <button
                            className="button"
                            onClick={() =>
                              setStopForm({
                                id: stop.id,
                                stationId: stop.stationId,
                                sequence: String(stop.sequence),
                                minutesFromStart: String(stop.minutesFromStart),
                              })
                            }
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="button button--danger"
                            onClick={() => void handleDeleteStop(stop.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="empty-state">Create a route first, then manage its stops here.</p>
              )}
            </div>

            <div className="card card--wide">
              <h2>Train schedules</h2>
              <form className="search-grid" onSubmit={handleScheduleSubmit}>
                <label className="field">
                  <span>Route</span>
                  <select
                    required
                    value={scheduleForm.routeId}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        routeId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Departure</span>
                  <input
                    required
                    type="datetime-local"
                    value={scheduleForm.departureAt}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        departureAt: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Train number</span>
                  <input
                    required
                    value={scheduleForm.trainNumber}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        trainNumber: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Train type</span>
                  <select
                    value={scheduleForm.trainType}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        trainType: event.target.value as TrainType,
                      }))
                    }
                  >
                    {TRAIN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="inline-actions">
                  <button className="button button--primary" type="submit">
                    {scheduleForm.id ? 'Update departure' : 'Create departure'}
                  </button>
                  {scheduleForm.id && (
                    <button
                      className="button"
                      onClick={() =>
                        setScheduleForm({
                          ...emptyScheduleForm,
                          routeId: routes[0]?.id ?? '',
                        })
                      }
                      type="button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="list">
                {adminSchedules.map((schedule) => (
                  <div className="list-card" key={schedule.id}>
                    <div className="list-card__head">
                      <strong>{schedule.route.name}</strong>
                      <span>{schedule.trainType}</span>
                    </div>
                    <div className="list-card__meta">
                      <span>Train {schedule.trainNumber}</span>
                      <span>{formatDateTime(schedule.departureAt)}</span>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="button"
                        onClick={() =>
                          setScheduleForm({
                            id: schedule.id,
                            routeId: schedule.routeId,
                            departureAt: toLocalInputValue(schedule.departureAt),
                            trainNumber: schedule.trainNumber,
                            trainType: schedule.trainType,
                          })
                        }
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="button button--danger"
                        onClick={() => void handleDeleteAdminSchedule(schedule.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

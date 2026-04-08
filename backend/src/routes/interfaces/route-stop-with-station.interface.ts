export interface RouteStopWithStation {
  id: string;
  routeId: string;
  stationId: string;
  sequence: number;
  minutesFromStart: number;
  station: {
    id: string;
    name: string;
    code: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

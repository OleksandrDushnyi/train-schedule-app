export const routeInclude = {
  stops: {
    orderBy: { sequence: 'asc' as const },
    include: { station: true },
  },
};

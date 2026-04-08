export const scheduleInclude = {
  route: {
    include: {
      stops: {
        orderBy: { sequence: 'asc' as const },
        include: { station: true },
      },
    },
  },
};

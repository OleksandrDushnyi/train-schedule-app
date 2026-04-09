import type { TrainType as TrainTypeValue } from '../types/train-type.type';

export const TrainType = {
  EXPRESS: 'EXPRESS',
  REGIONAL: 'REGIONAL',
  SUBURBAN: 'SUBURBAN',
  INTERCITY: 'INTERCITY',
} as const satisfies Record<TrainTypeValue, TrainTypeValue>;

export type TrainType = TrainTypeValue;

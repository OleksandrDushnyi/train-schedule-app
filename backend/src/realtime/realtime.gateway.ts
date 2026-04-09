import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { createCorsOriginDelegate } from '../common/utils/cors.util';
import type { TrainScheduleWithRoute } from '../train-schedules/interfaces';
import type { DeletedTrainScheduleEvent } from './interfaces';
import { RealtimeEvent } from './realtime.constants';

@WebSocketGateway({
  namespace: 'realtime',
  cors: {
    origin: createCorsOriginDelegate(),
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  afterInit(): void {
    this.logger.log('Realtime gateway ready at /realtime');
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitTrainScheduleCreated(schedule: TrainScheduleWithRoute): void {
    this.server.emit(RealtimeEvent.TRAIN_SCHEDULE_CREATED, schedule);
  }

  emitTrainScheduleUpdated(schedule: TrainScheduleWithRoute): void {
    this.server.emit(RealtimeEvent.TRAIN_SCHEDULE_UPDATED, schedule);
  }

  emitTrainScheduleDeleted(payload: DeletedTrainScheduleEvent): void {
    this.server.emit(RealtimeEvent.TRAIN_SCHEDULE_DELETED, payload);
  }
}

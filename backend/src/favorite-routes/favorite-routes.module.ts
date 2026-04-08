import { Module } from '@nestjs/common';
import { FavoriteRoutesController } from './favorite-routes.controller';
import { FavoriteRoutesService } from './favorite-routes.service';

@Module({
  controllers: [FavoriteRoutesController],
  providers: [FavoriteRoutesService],
})
export class FavoriteRoutesModule {}

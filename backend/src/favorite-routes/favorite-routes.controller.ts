import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CreateFavoriteRouteDto } from './dto/create-favorite-route.dto';
import { FavoriteRoutesService } from './favorite-routes.service';

@ApiTags('user — favorite routes')
@Controller('favorite-routes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FavoriteRoutesController {
  constructor(private readonly favoriteRoutesService: FavoriteRoutesService) {}

  @Get()
  @ApiOperation({ summary: 'List favorite routes' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.favoriteRoutesService.findAll(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add route to favorites' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateFavoriteRouteDto) {
    return this.favoriteRoutesService.create(user.userId, dto);
  }

  @Delete(':routeId')
  @ApiOperation({ summary: 'Remove route from favorites' })
  remove(
    @CurrentUser() user: JwtUser,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ) {
    return this.favoriteRoutesService.remove(user.userId, routeId);
  }
}

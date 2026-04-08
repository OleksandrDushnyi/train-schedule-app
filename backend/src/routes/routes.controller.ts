import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { RoutesService } from './routes.service';

@ApiTags('admin — routes')
@Controller('admin/routes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @ApiOperation({ summary: 'Create route' })
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List routes with stops' })
  findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route with stops' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.routesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update route' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete route' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.routesService.remove(id);
  }

  @Post(':routeId/stops')
  @ApiOperation({ summary: 'Add stop to route' })
  addStop(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Body() dto: CreateRouteStopDto,
  ) {
    return this.routesService.addStop(routeId, dto);
  }

  @Patch(':routeId/stops/:stopId')
  @ApiOperation({ summary: 'Update route stop' })
  updateStop(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: UpdateRouteStopDto,
  ) {
    return this.routesService.updateStop(routeId, stopId, dto);
  }

  @Delete(':routeId/stops/:stopId')
  @ApiOperation({ summary: 'Remove stop from route' })
  removeStop(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
  ) {
    return this.routesService.removeStop(routeId, stopId);
  }
}

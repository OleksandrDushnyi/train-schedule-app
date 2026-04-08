import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryTrainSchedulesDto } from '../train-schedules/dto/query-train-schedules.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('user — schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Browse train schedules' })
  findAll(@Query() query: QueryTrainSchedulesDto) {
    return this.schedulesService.findAll(query);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Available schedule filters' })
  filters() {
    return this.schedulesService.findAvailableFilters();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get train schedule details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulesService.findOne(id);
  }
}

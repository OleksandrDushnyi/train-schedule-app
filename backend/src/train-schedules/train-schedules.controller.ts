import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateTrainScheduleDto } from './dto/create-train-schedule.dto';
import { QueryTrainSchedulesDto } from './dto/query-train-schedules.dto';
import { UpdateTrainScheduleDto } from './dto/update-train-schedule.dto';
import { TrainSchedulesService } from './train-schedules.service';

@ApiTags('admin — train schedules')
@Controller('admin/train-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class TrainSchedulesController {
  constructor(private readonly trainSchedulesService: TrainSchedulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create train schedule' })
  create(@Body() dto: CreateTrainScheduleDto) {
    return this.trainSchedulesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List train schedules' })
  findAll(@Query() query: QueryTrainSchedulesDto) {
    return this.trainSchedulesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get train schedule' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainSchedulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update train schedule' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainScheduleDto,
  ) {
    return this.trainSchedulesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete train schedule' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.trainSchedulesService.remove(id);
  }
}

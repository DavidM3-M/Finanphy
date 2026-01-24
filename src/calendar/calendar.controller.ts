import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';
import { CalendarService } from './calendar.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  getEvents(
    @CurrentUser() user: UserEntity,
    @Query() query: CalendarQueryDto,
  ) {
    return this.calendarService.getEventsForUser(
      user.id,
      query.from,
      query.to,
      query.companyId,
    );
  }
}

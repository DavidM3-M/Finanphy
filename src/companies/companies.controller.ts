import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.User, Role.Admin)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Post()
  @Roles(Role.User, Role.Admin)
  createCompany(@Body() dto: CreateCompanyDto, @Req() req) {
    return this.service.create(dto, req.user.id);
  }

  @Get('my')
  getMyCompanies(@Req() req) {
    return this.service.findAllByUser(req.user.id);
  }

  @Get(':id')
  getCompanyById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  updateCompany(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @Req() req,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  deleteCompany(@Param('id') id: string, @Req() req) {
    return this.service.delete(id, req.user.id);
  }
}
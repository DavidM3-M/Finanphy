import { Controller, Post, Get, Delete, Param, Body, Put, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InvestmentsService } from '../services/investments.service';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';
import { AuthGuard } from 'node_modules/@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ManyToOne } from 'node_modules/typeorm';
import { Company } from 'src/companies/entities/company.entity';


@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  create(@Body() data: CreateInvestmentDto) {
    return this.investmentsService.create(data);
  }

  @Get()
  findAll() {
    return this.investmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id:number, @Body() dto: UpdateInvestmentDto){
    return this.investmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.remove(id);
  }

  @ManyToOne(() => Company, company => company.investments)
  company: Company;

}

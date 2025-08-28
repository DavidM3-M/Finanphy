import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';

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
  findOne(@Param('id') id: number) {
    return this.investmentsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.investmentsService.remove(id);
  }
}

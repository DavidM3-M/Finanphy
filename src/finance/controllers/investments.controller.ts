import { Controller, Post, Get, Delete, Param, Body, Put, ParseIntPipe } from '@nestjs/common';
import { InvestmentsService } from '../services/investments.service';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';


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
}

// src/finance/incomes.controller.ts
import { Controller, Get, Post, Param, Body, ParseIntPipe, Put, Delete } from '@nestjs/common';
import { IncomesService } from '../services/incomes.service';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  findAll() {
    return this.incomesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.incomesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIncomeDto) {
    return this.incomesService.create(dto);

  }
 
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIncomeDto) {
    return this.incomesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.incomesService.remove(id);
  }
}
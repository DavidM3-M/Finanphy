import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-companies.dto';

@Controller('companies')
export class CompaniesController {

  constructor(private readonly companiesService: CompaniesService) {}

  
  @Post(':userId')
  create(
    @Param('userId') userId: string,
    @Body() createCompanyDto: CreateCompanyDto
  ) {
    return this.companiesService.create(createCompanyDto, userId);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
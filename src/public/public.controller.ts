import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Catálogo público por empresa
  @Get('products/company/:companyId')
  getCatalog(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.publicService.getCatalogByCompany(companyId);
  }
}
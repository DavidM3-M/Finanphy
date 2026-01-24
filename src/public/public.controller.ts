import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Catálogo público por empresa
  @Public()
  @Get('products/company/:companyId')
  getCatalog(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicService.getCatalogByCompany(companyId, page, limit);
  }
}

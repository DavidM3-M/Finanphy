import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-suppliers.dto';

@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService){}

    @Post(':companyId')
    create(
        @Param('companyId') companyId:string,
        @Body() createSupplierDto:CreateSupplierDto){
        return this.suppliersService.create(createSupplierDto, companyId);
    }

    @Get()
    findAll(){
        return this.suppliersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id:string){
        return this.suppliersService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id')id:string){
        return this.suppliersService.remove(id);
    }
}

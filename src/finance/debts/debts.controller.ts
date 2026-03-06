import { Controller, Post, Get, Param,Body } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';

@Controller('debts')
export class DebtsController {

    constructor(private readonly debtsService:DebtsService){}

    @Post(':supplierId')
    create(
        @Param('supplierId')supplierId:string,
        @Body()CreateDebtDto:CreateDebtDto,
    ){
        return this.debtsService.create(supplierId,CreateDebtDto);
    }
    
    @Get(':id')
    findOne(@Param('id') id:string){
        return this.debtsService.findOne(id);
    }
}

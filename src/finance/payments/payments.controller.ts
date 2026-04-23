import { Controller, Post, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';


@Controller('payments')
export class PaymentsController {

    constructor(private readonly paymentsService:PaymentsService){}

    @Post(':debtId')
    create(
        @Param('debtId') debtId:string,
        @Body() createPaymentDto:CreatePaymentDto,
        @Body('userId') userId:string
    ){
        return this.paymentsService.create(debtId,createPaymentDto, userId);
    }
}

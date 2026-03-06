import {IsNumber, IsPositive} from "class-validator";

export class CreatePaymentDto{

    @IsNumber()
    @IsPositive()
    amount!:number;
}
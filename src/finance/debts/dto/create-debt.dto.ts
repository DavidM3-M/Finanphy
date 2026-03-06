import { IsNumber, IsPositive } from "class-validator";

export class CreateDebtDto{

    @IsNumber()
    @IsPositive()
    amount!:number;
}
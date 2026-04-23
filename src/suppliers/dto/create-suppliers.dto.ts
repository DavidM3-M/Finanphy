import { IsString,IsOptional, IsNotEmpty } from "class-validator";

export class CreateSupplierDto{
    @IsString()
    @IsNotEmpty()
    name!:string;

    @IsOptional()
    @IsString()
    address?:string;
    
    @IsOptional()
    @IsString()
    phone?:string;
}
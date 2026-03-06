import { IsString, IsNotEmpty, IsOptional} from "class-validator";

export class CreateCompanyDto{

    @IsString()
    @IsNotEmpty()
    tradeName!:string;

    @IsString()
    @IsOptional()
    legalName?:string;

    @IsString()
    @IsOptional()
    taxId?:string;
}
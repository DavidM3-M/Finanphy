import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSupplierDto} from './dto/create-suppliers.dto';
import { Supplier } from './entities/suppliers.entity';
import { Company } from '../companies/entities/companies.entity';

@Injectable()
export class SuppliersService {

    constructor(
        @InjectRepository(Supplier)
        private supplierRepository: Repository<Supplier>,  
    ){}

    create(createSupplierDto:CreateSupplierDto, companyId:string){
        const supplier=this.supplierRepository.create(createSupplierDto);
        supplier.company = {id:companyId} as Company;
        return this.supplierRepository.save(supplier);
    }

    findAll(){
        return this.supplierRepository.find({
            relations:['company'],
        });
    }

    findOne(id:string){
        return this.supplierRepository.findOne({
            where:{id},
            relations:['company'],
        });
    }

    remove(id:string){
        return this.supplierRepository.delete(id);
    }
}

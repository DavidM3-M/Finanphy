import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCompanyDto} from './dto/create-companies.dto';
import { Company } from './entities/companies.entity';
import { User } from '../users/entity/users.entity';

@Injectable()
export class CompaniesService {

    constructor(
        @InjectRepository(Company)
        private companyRepository: Repository<Company>,
    ){}

    create(createCompanyDto:CreateCompanyDto,userId:string ){
        const company = this.companyRepository.create(createCompanyDto);
        company.user = {id:userId} as User;
        return this.companyRepository.save(company);
    }


    findAll(){
        return this.companyRepository.find({
            relations:['user','suppliers'],
        });
    }

    findOne(id:string){
        return this.companyRepository.findOne({
            where:{id},
            relations:['user','suppliers'],
        });
    }

    remove(id:string){
        return this.companyRepository.delete(id);
    }
}

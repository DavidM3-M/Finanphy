import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-users.dto';
import { User } from './entity/users.entity';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

    create(createUserDto:CreateUserDto){
        const user = this.userRepository.create(createUserDto);
        return this.userRepository.save(user);
    }

    findAll(){
        return this.userRepository.find({
            relations:['companies'],
        });
    }

    findOne(id:string){
        return this.userRepository.findOne({
            where:{id},
            relations:['companies', 'companies.suppliers'],
        });
    }

    remove(id:string){
        return this.userRepository.delete(id);
    }

}

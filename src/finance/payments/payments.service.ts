import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { Debt } from 'src/finance/debts/entities/debt.entity';
import { User } from '../users/entity/users.entity';

@Injectable()
export class PaymentsService {

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,

        @InjectRepository(Debt)
        private debtRepository: Repository<Debt>,

        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}
    
    async create(debtId:string, createPaymentDto:CreatePaymentDto, userId:string){
        const debt = await this.debtRepository.findOne({
            where:{
                id:debtId,
                user:{id:userId}
            },
            relations:['payments', 'user'],
        }); 

    if(!debt){
        throw new NotFoundException(`Deuda con ID ${debtId} no encontrada`);
    }

    const totalPaid= debt.payments.reduce(
        (sum, payment) => sum + Number(payment.amount), 0,
    );

    const remaining=Number(debt.amount) - totalPaid;

    if(createPaymentDto.amount > remaining){
        throw new BadRequestException(`El monto del pago excede el monto restante de la deuda. Monto restante: ${remaining}`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const payment = new Payment();
    payment.amount = createPaymentDto.amount;
    payment.debt = debt;
    payment.createdBy = user;

    const savedPayment = await this.paymentRepository.save(payment);

    const newTotalPaid = totalPaid + createPaymentDto.amount;

    if(newTotalPaid >= Number(debt.amount)){
        await this.debtRepository.createQueryBuilder()
            .update(Debt)
            .set({ isActive: false })
            .where("id = :id", { id: debt.id })
            .execute();
    }

    return savedPayment;
    }
}

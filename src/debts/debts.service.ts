import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt } from './entities/debt.entity';
import { Supplier } from '../suppliers/entities/suppliers.entity';
import { CreateDebtDto } from './dto/create-debt.dto';

@Injectable()
export class DebtsService {

  constructor(
    @InjectRepository(Debt)
    private debtRepository: Repository<Debt>,

    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async create(supplierId: string, createDebtDto: CreateDebtDto) {

    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID ${supplierId} no encontrado`);
    }

    const debt = this.debtRepository.create(createDebtDto);
    debt.supplier = supplier;

    return this.debtRepository.save(debt);
  }

  async findOne(id: string) {

    const debt = await this.debtRepository.findOne({
      where: { id },
      relations: ['supplier', 'payments'],
    });

    if (!debt) {
      throw new NotFoundException(`Deuda con ID ${id} no encontrada`);
    }

    //Sumar todos los pagos
    const totalPaid= debt.payments.reduce((sum, payment) =>{
      return sum + payment.amount;
      
    },0 );

    //Calcular lo que faltaba 
    const remaining=(debt.amount) - totalPaid; 

    if(remaining <= 0){
      debt.isActive = false;
      await this.debtRepository.save(debt);//Actualizar el estado de la deuda si ya se ha pagado completamente
    }

    return {
      ...debt,
      totalPaid,
      remaining,
    };
  }
}
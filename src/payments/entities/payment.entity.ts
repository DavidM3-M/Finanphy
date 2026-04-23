import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn} from "typeorm";
import { Debt } from "src/finance/debts/entities/debt.entity";
import { User } from "src/finance/users/entity/users.entity";

@Entity('payments')
export class Payment{

    @PrimaryGeneratedColumn('uuid')
    id!:string;

    @Column('decimal')
    amount!:number;

    @CreateDateColumn()
    paymentDate!:Date;

    @ManyToOne(() => Debt, debt=>debt.payments, {
        onDelete:'CASCADE',
    })
    debt!:Debt;

    @ManyToOne(() => User, user=> user.payments)
    createdBy!:User;
}
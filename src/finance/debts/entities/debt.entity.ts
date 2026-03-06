import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Supplier } from "src/finance/suppliers/entities/suppliers.entity";
import { Payment } from "src/finance/payments/entities/payment.entity";
import { User } from "src/finance/users/entity/users.entity";

@Entity('debts')
export class Debt{
    @PrimaryGeneratedColumn('uuid')
    id!:string;

    @Column('decimal')
    amount!:number;

    @Column({default:true})
    isActive!:boolean;

    @ManyToOne(() => Supplier, supplier=>supplier.debts, {
        onDelete:'CASCADE',
    })
    supplier!:Supplier;

    @OneToMany(() => Payment, payment=>payment.debt)
    payments!:Payment[];

    @ManyToOne(() => User, (user) => user.debts)
    user!: User;
}
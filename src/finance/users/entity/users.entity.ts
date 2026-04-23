import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from "typeorm";
import { Company } from "src/finance/companies/entities/companies.entity";
import { Payment } from "src/finance/payments/entities/payment.entity";
import { Debt } from "src/finance/debts/entities/debt.entity";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @OneToOne(() => Company, company => company.user)
    company!: Company;

    @OneToMany(() => Payment, payment => payment.createdBy)
    payments!: Payment[];

    @OneToMany(() => Debt, debt => debt.user)
    debts!: Debt[];

}
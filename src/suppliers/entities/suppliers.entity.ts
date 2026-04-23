import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany } from "typeorm";
import { Company } from "src/finance/companies/entities/companies.entity";
import { Debt } from "src/finance/debts/entities/debt.entity";

@Entity('suppliers')
export class Supplier{

    @PrimaryGeneratedColumn('uuid')
    id!:string;

    @Column()
    name!:string;

    @Column({nullable:true})
    address?:string;

    @Column({nullable:true})
    phone?:string;

    @ManyToOne(() => Company, company=>company.suppliers, {
        onDelete:'CASCADE',
    })
    company!:Company;

    @OneToMany(() => Debt, debt=>debt.supplier)
    debts!:Debt[];

}
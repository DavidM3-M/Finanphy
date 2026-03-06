import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany , JoinColumn} from "typeorm";
import { User } from "src/finance/users/entity/users.entity";
import { Supplier } from "src/finance/suppliers/entities/suppliers.entity";


@Entity('companies')
export class Company{

    @PrimaryGeneratedColumn('uuid')
    id!:string;

    @Column()
    tradeName!:string;

    @Column({nullable:true})
    legalName?:string;

    @Column({nullable:true})
    taxId?:string;

    @OneToOne(() =>User, user=>user.company, {
        onDelete:'CASCADE',
    })
    @JoinColumn()
    user!:User;

    @OneToMany(() => Supplier, supplier=>supplier.company)
    suppliers!:Supplier[];
}
import { Role } from "../../auth/enums/role.enum";
import { Company } from "../../companies/entities/company.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.User })
    role: Role;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Company, company => company.user)
    companies: Company[];

}

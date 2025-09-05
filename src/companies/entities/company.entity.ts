// src/companies/entities/company.entity.ts
import { Expense } from '../../finance/entities/expense.entity';
import { Income } from '../../finance/entities/income.entity';
import { Investment } from '../../finance/entities/investment.entity';
import { Product } from '../../products/entities/product.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Legal identity
  @Column()
  tradeName: string;

  @Column()
  legalName: string;

  @Column()
  companyType: string; // e.g., S.A.S., LTDA, S.A.

  @Column()
  taxId: string;

  @Column({ nullable: true })
  taxRegistry: string;

  @Column({ nullable: true })
  businessPurpose: string;

  // Contact and location
  @Column({ nullable: true })
  companyEmail: string;

  @Column({ nullable: true })
  companyPhone: string;

  @Column({ nullable: true })
  fiscalAddress: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  // Legal representative
  @Column({ nullable: true })
  representativeName: string;

  @Column({ nullable: true })
  representativeDocument: string;

  @Column({ nullable: true })
  incorporationDate: string;

  @ManyToOne(() => UserEntity, user => user.companies)
  user: UserEntity;

  @OneToMany(() => Income, income => income.company)
  incomes: Income[];

  @OneToMany(() => Expense, expense => expense.company)
  expenses: Expense[];

  @OneToMany(() => Investment, investment => investment.company)
  investments: Investment[];

  @OneToMany(() => Product, product => product.company)
  products: Product[];

}

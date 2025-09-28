// src/finance/investment.entity.ts
import { Company } from '../../companies/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Investment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal')
  amount!: number;

  @Column()
  category!: string;

  @Column({ nullable: true })
  invoicenumber?: string;


  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  entryDate!: Date; //fecha entrada

  @Column({ type: 'timestamp', nullable: true })
  exitDate?: Date; //fecha salida

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date; //fecha vencimiento

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, company => company.investments)
  @JoinColumn({ name: 'companyId' })
  company!: Company;
}

// src/finance/expense.entity.ts
import { Company } from '../../companies/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column()
  category!: string;

  @Column({ nullable: true })
  supplier?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  entryDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, company => company.expenses)
  @JoinColumn({ name: 'companyId' })
  company!: Company;


}

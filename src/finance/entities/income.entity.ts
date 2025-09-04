// src/finance/income.entity.ts
import { Company } from '../../companies/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity()
export class Income {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  invoiceNumber?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  entryDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @ManyToOne(() => Company, company => company.incomes)
  company: Company;


}

// src/finance/income.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  entryDate: Date;

  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date;

}

// src/expenses/entities/expense.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  description: string;

  @Column({ 
    type: 'decimal', 
    precision: 12, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  amount: number; // Monto en COP

  @Column({ length: 100 })
  category: string;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor para facilitar la creación de instancias
  constructor(expense?: Partial<Expense>) {
    if (expense) {
      Object.assign(this, expense);
    }
  }
}


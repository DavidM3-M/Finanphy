// src/finance/investment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Investment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  amount: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  invoicenumber?: string;

  // Fecha de creación automática
  @CreateDateColumn()
  createdAt: Date;

  //  Fecha de actualización automática
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
   entryDate: Date; //fecha entrada

  @Column({ type: 'timestamp', nullable: true })
  exitDate?: Date; //fecha salida

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date; //fecha vencimiento

  
}

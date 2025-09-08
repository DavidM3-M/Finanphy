// src/orders/entities/order.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  customerName: string;

  @Column({ length: 255 })
  product: string;  

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

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ length: 100 })
  status: string; // 'pending', 'completed', 'cancelled'

  @Column({ type: 'date' })
  orderDate: Date;

  @Column({ type: 'date', nullable: true })
  deliveryDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(order?: Partial<Order>) {
    if (order) {
      Object.assign(this, order);
    }
  }
}
// src/inventory/movement.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column()
  quantity: number;

  @Column()
  type: 'IN' | 'OUT'; // tipo de movimiento

  @CreateDateColumn()
  createdAt: Date;
}

// src/products/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column('decimal', { precision: 12, scale: 2 }) 
  price: number;

  @Column('decimal', { precision: 12, scale: 2 })
  cost: number;

  @Column({ default: 0 })
  stock: number;
}

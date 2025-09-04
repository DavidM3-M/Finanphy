// src/products/product.entity.ts
import { Company } from '../../companies/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column('decimal', { precision: 12, scale: 2 }) 
  price: number;

  @Column('decimal', { precision: 12, scale: 2 })
  cost: number;

  @Column({ default: 0 })
  stock: number;

  @ManyToOne(() => Company, company => company.products)
  company: Company;
}

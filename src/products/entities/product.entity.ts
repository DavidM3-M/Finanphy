// src/products/product.entity.ts
import { Company } from '../../companies/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';

@Index(['sku', 'companyId'], { unique: true })

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  sku!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column('decimal', { precision: 12, scale: 2 }) 
  price!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  cost!: number;

  @Column({ default: true })
  isPublic!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  stock!: number;

   @Column({ type: 'uuid' }) // 👈 necesario para el índice
  companyId!: string;

  @ManyToOne(() => Company, company => company.products)
  @JoinColumn({ name: 'companyId' })
  company!: Company;
}

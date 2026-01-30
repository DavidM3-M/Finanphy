import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { SupplierOrder } from 'src/supplier_orders/entities/supplier-order.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  contact?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  debt!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  credit!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @OneToMany<SupplierOrder>(() => SupplierOrder, (o) => o.supplier)
  orders!: SupplierOrder[];
}

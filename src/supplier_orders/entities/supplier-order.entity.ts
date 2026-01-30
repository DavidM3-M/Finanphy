import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Company } from 'src/companies/entities/company.entity';
import { SupplierOrderItem } from './supplier-order-item.entity';

@Entity('supplier_orders')
export class SupplierOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne<Supplier>(() => Supplier, (s) => s.orders, { eager: true })
  @JoinColumn({ name: 'supplierId' })
  supplier!: Supplier;

  @Column('uuid')
  supplierId!: string;

  @ManyToOne(() => Company, { eager: true })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @Column('uuid')
  companyId!: string;

  @OneToMany(() => SupplierOrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: SupplierOrderItem[];

  @Column({ type: 'varchar', unique: true })
  orderCode!: string;

  @Column({
    type: 'enum',
    enum: ['recibido', 'en_proceso', 'recibido_pago'],
    default: 'recibido',
  })
  status!: 'recibido' | 'en_proceso' | 'recibido_pago';

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoiceFilename?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceMime?: string | null;

  @Column({ type: 'bigint', nullable: true })
  invoiceSize?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  invoiceUploadedAt?: Date | null;
}

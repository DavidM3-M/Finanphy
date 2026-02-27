import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';

@Entity('customer_payments')
export class CustomerPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  customerId!: string;

  @ManyToOne(() => Customer, (c) => c.orders, { nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column('uuid', { nullable: true })
  orderId?: string | null;

  @ManyToOne(() => ClientOrder, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order?: ClientOrder | null;

  @Column({ type: 'timestamptz' })
  paidAt!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  evidenceFilename?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  evidenceMime?: string | null;

  @Column({ type: 'bigint', nullable: true })
  evidenceSize?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  evidenceUploadedAt?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  evidenceUrl?: string | null;

  @Column('decimal', { precision: 12, scale: 2 })
  balanceAfter!: number;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

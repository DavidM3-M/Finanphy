// src/client-orders/entities/client-order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Column,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { ClientOrderItem } from './client-order-item.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { Customer } from 'src/customers/entities/customer.entity';

@Entity('client_orders')
export class ClientOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Company, { eager: true })
  company!: Company;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @OneToMany(() => ClientOrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: ClientOrderItem[];

  @Column({
    type: 'enum',
    enum: ['recibido', 'en_proceso', 'enviado'],
    default: 'recibido',
  })
  status!: 'recibido' | 'en_proceso' | 'enviado';

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date | null;

  @Column({ unique: true })
  orderCode!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid', { nullable: true })
  customerId?: string | null;

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

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    nullable: true,
  })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;
}

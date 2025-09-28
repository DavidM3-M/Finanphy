// src/client-orders/entities/client-order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { ClientOrderItem } from './client-order-item.entity';

@Entity('client_orders')
export class ClientOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Company, { eager: true })
  company!: Company;

  @OneToMany(() => ClientOrderItem, item => item.order, {
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

  @Column({ unique: true })
  orderCode!: string;
}
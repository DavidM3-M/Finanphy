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
import { UserEntity } from 'src/users/entities/user.entity';

@Entity('client_orders')
export class ClientOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Company, { eager: true })
  company!: Company;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

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

  @Column('uuid')
  userId!: string;

}
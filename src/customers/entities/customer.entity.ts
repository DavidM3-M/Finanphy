/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  documentId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Company, (company) => company.customers, {
    nullable: false,
  })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @OneToMany(() => ClientOrder, (order) => order.customer)
  orders!: ClientOrder[];
}

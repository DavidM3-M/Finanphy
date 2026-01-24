import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { Income } from 'src/finance/entities/income.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ type: 'timestamp with time zone' })
  remindAt!: Date;

  @Column({ default: false })
  allDay!: boolean;

  @Column({ nullable: true })
  type?: string;

  @Column({ type: 'varchar', nullable: true })
  attachmentUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  attachmentFilename?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  attachmentMime?: string | null;

  @Column({ type: 'bigint', nullable: true })
  attachmentSize?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  attachmentUploadedAt?: Date | null;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string | null;

  @Column({ type: 'int', nullable: true })
  incomeId?: number | null;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company | null;

  @ManyToOne(() => Income, { nullable: true })
  @JoinColumn({ name: 'incomeId' })
  income?: Income | null;

  @ManyToOne(() => ClientOrder, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order?: ClientOrder | null;
}

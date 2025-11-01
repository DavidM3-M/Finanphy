import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity()
export class Income {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column()
  category!: string;

  @Column({nullable:true})
  description!:string;

  @Column({ nullable: true })
  invoiceNumber?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // ahora timestamptz, nullable y con default CURRENT_TIMESTAMP para compatibilidad
  @Column({ type: 'timestamp with time zone', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  entryDate: Date | null;

  // dueDate también como timestamptz y nullable
  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, company => company.incomes, { nullable: false })
  @JoinColumn({ name: 'companyId' })
  company!: Company;
}
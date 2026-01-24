import { Role } from '../../auth/enums/role.enum';
import { Company } from '../../companies/entities/company.entity';
import { Reminder } from '../../reminders/entities/reminder.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role!: Role;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Company, (company) => company.user)
  companies!: Company[];

  @OneToMany(() => Reminder, (reminder) => reminder.user)
  reminders!: Reminder[];
}

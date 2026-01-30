import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupplierOrder } from './supplier-order.entity';

@Entity('supplier_order_items')
export class SupplierOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  productId!: string;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice!: number;

  @ManyToOne(() => SupplierOrder, (o) => o.items, { nullable: false })
  @JoinColumn({ name: 'orderId' })
  order!: SupplierOrder;

  @Column('uuid')
  orderId!: string;
}

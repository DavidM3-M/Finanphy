import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from 'typeorm';
import { ClientOrder } from './client-order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('client_order_items')
export class ClientOrderItem {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => ClientOrder, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order!: ClientOrder;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice!: number;
}

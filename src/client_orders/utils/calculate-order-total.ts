import { ClientOrderItem } from '../entities/client-order-item.entity';

export function calculateOrderTotal(items: ClientOrderItem[]): number {
  return items.reduce(
    (total, item) => total + Number(item.unitPrice) * item.quantity,
    0,
  );
}

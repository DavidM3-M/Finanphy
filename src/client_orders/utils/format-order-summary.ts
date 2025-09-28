import { ClientOrderItem } from "../entities/client-order-item.entity";

export function formatOrderSummary(items: ClientOrderItem[]): string {
  return items.map(item => {
    const total = Number(item.unitPrice) * item.quantity;
    return `${item.quantity} x ${item.product.name} @ $${item.unitPrice} = $${total.toFixed(2)}`;
  }).join('\n');
}
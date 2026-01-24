import { ClientOrderItem } from '../entities/client-order-item.entity';

export function groupItemsByProduct(
  items: ClientOrderItem[],
): ClientOrderItem[] {
  const map = new Map<string, ClientOrderItem>();

  for (const item of items) {
    const key = String(item.product.id);
    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      const existing = map.get(key)!;
      existing.quantity += item.quantity;
    }
  }

  return Array.from(map.values());
}

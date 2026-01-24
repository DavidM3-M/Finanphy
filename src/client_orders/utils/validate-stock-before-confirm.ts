import { Product } from 'src/products/entities/product.entity';
import { ClientOrderItem } from '../entities/client-order-item.entity';

export function validateStock(
  items: ClientOrderItem[],
  products: Product[],
): string[] {
  const errors: string[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.product.id);
    if (!product) {
      errors.push(`Producto no encontrado: ${item.product.id}`);
    } else if (product.stock < item.quantity) {
      errors.push(
        `Stock insuficiente para ${product.name}: disponible ${product.stock}, solicitado ${item.quantity}`,
      );
    }
  }

  return errors;
}

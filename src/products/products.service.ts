import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, DataSource, QueryRunner, In } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';
import {
  buildPaginatedResponse,
  parsePagination,
} from 'src/common/helpers/pagination';

export type ImagePayload = {
  buffer: Buffer;
  filename?: string | null;
  mimetype?: string | null;
  size?: number | null;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    private readonly dataSource: DataSource,
  ) {}

  // Vendedor: ver todos sus productos
  async findAllByUser(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    const [data, total] = await this.productsRepo
      .createQueryBuilder('product')
      .leftJoin('product.company', 'company')
      .where('company.userId = :userId', { userId })
      .orderBy('product.name', 'ASC')
      .skip(offset)
      .take(l)
      .getManyAndCount();

    return buildPaginatedResponse(data, total, p, l);
  }

  // Verificar stock para varios productos: devuelve disponibilidad por item
  async checkStock(items: Array<{ productId: string; quantity: number }>) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const ids = items.map((i) => i.productId);
    const products = await this.productsRepo.find({ where: { id: In(ids) } });

    return items.map((it) => {
      const prod = products.find((p) => String(p.id) === String(it.productId));
      if (!prod) {
        return {
          productId: it.productId,
          requested: Number(it.quantity ?? 0),
          available: null,
          sufficient: false,
        };
      }
      const available = Number(prod.stock ?? 0);
      const requested = Number(it.quantity ?? 0);
      return {
        productId: it.productId,
        requested,
        available,
        sufficient: available >= requested,
      };
    });
  }

  // Cliente: ver catálogo público de una compañía
  async findAllByCompany(companyId: string, page?: string, limit?: string) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.productsRepo.findAndCount({
      where: { company: { id: companyId } },
      order: { name: 'ASC' },
      skip: offset,
      take: l,
    });

    return buildPaginatedResponse(data, total, p, l);
  }

  // Vendedor: ver un producto específico
  async findOneByUser(id: string, userId: string) {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.company.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este producto');
    }

    return product;
  }

  // Helpers para normalizar tipos
  private toNumber(value: unknown, fallback = 0): number {
    if (value === undefined || value === null || value === '') return fallback;
    return typeof value === 'number' ? value : Number(value);
  }

  // Vendedor: crear producto en una compañía
  // Vendedor: crear producto en una compañía
  async createForUser(
    dto: CreateProductDto & Partial<{ image: ImagePayload }>,
    userId: string,
  ) {
    let company: Company;

    if (dto.companyId) {
      company = await validateCompanyOwnership(
        this.companyRepo,
        dto.companyId,
        userId,
      );
    } else {
      const companies = await this.companyRepo.find({ where: { userId } });

      if (companies.length === 0) {
        throw new ForbiddenException('No tienes empresas registradas');
      }

      if (companies.length > 1) {
        throw new BadRequestException('Debes especificar la empresa');
      }

      company = companies[0];
    }

    const existing = await this.productsRepo.findOne({
      where: { sku: dto.sku, companyId: company.id },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe un producto con el SKU ${dto.sku} en esta empresa`,
      );
    }

    // Normalizar valores
    const price = this.toNumber(dto.price, 0);
    const cost = this.toNumber(dto.cost, 0);
    const stock = this.toNumber(dto.stock, 0);

    // imageUrl puede ser string | null; si viene undefined -> mantener null
    const imageUrl = dto.imageUrl === undefined ? null : dto.imageUrl;

    const product = this.productsRepo.create({
      name: dto.name,
      sku: dto.sku,
      description: dto.description ?? null,
      category: dto.category ?? null,
      imageUrl: imageUrl,
      price,
      cost,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : null,
      stock,
      company,
      companyId: company.id,
    } as DeepPartial<Product>);

    // Guardar imagen si viene en DTO (dto.image expected: { buffer, filename, mimetype, size })
    if (dto.image) {
      const img = dto.image;
      product.image_data = Buffer.from(img.buffer);
      product.image_filename = img.filename ?? null;
      product.image_mime = img.mimetype ?? null;
      product.image_size = img.size ?? null;
      product.image_uploaded_at = new Date();
    }

    return this.productsRepo.save(product);
  }

  // Vendedor: actualizar producto
  async updateForUser(
    id: string,
    dto: UpdateProductDto & Partial<{ image: ImagePayload }>,
    userId: string,
  ) {
    const product = await this.findOneByUser(id, userId);

    // Solo actualizar campos que vienen en dto (incluso si vienen como null)
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.sku !== undefined) product.sku = dto.sku;
    if (dto.description !== undefined)
      product.description = dto.description ?? null;
    if (dto.category !== undefined) product.category = dto.category ?? null;
    if (dto.imageUrl !== undefined) product.imageUrl = dto.imageUrl ?? null;
    if (dto.price !== undefined)
      product.price = this.toNumber(dto.price, product.price);
    if (dto.cost !== undefined)
      product.cost = this.toNumber(dto.cost, product.cost);
    if (dto.stock !== undefined)
      product.stock = this.toNumber(dto.stock, product.stock);

    if (dto.expiresAt !== undefined) {
      product.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }

    if (dto.entryDate !== undefined) {
      product.entryDate = dto.entryDate ? new Date(dto.entryDate) : null;
    }

    // Si se subió nueva imagen, sobrescribir campos de imagen
    if (dto.image) {
      const img = dto.image;
      product.image_data = Buffer.from(img.buffer);
      product.image_filename = img.filename ?? product.image_filename;
      product.image_mime = img.mimetype ?? product.image_mime;
      product.image_size = img.size ?? product.image_size;
      product.image_uploaded_at = new Date();
    }

    return this.productsRepo.save(product);
  }

  // Vendedor: eliminar producto
  async removeForUser(id: string, userId: string) {
    const product = await this.findOneByUser(id, userId);
    return this.productsRepo.remove(product);
  }

  // Público: listar por companyId (nombre compatible con controller)
  async findByCompany(
    companyId: string,
    page?: string,
    limit?: string,
    filters?: {
      q?: string | undefined;
      category?: string | undefined;
      expiresBefore?: string | undefined; // ISO date
      expiresAfter?: string | undefined; // ISO date
    },
  ) {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    const qb = this.productsRepo
      .createQueryBuilder('product')
      .where('product.companyId = :companyId', { companyId })
      .orderBy('product.name', 'ASC')
      .skip(offset)
      .take(l);

    if (filters) {
      if (filters.category) {
        qb.andWhere('product.category = :category', {
          category: String(filters.category),
        });
      }

      if (filters.q) {
        const q = `%${String(filters.q).trim()}%`;
        qb.andWhere(
          '(product.name ILIKE :q OR product.description ILIKE :q OR product.sku ILIKE :q)',
          { q },
        );
      }

      if (filters.expiresBefore) {
        const d = new Date(filters.expiresBefore);
        if (!isNaN(d.getTime())) {
          qb.andWhere(
            'product.expiresAt IS NOT NULL AND product.expiresAt <= :expBefore',
            {
              expBefore: d.toISOString(),
            },
          );
        }
      }

      if (filters.expiresAfter) {
        const d = new Date(filters.expiresAfter);
        if (!isNaN(d.getTime())) {
          qb.andWhere(
            'product.expiresAt IS NOT NULL AND product.expiresAt >= :expAfter',
            {
              expAfter: d.toISOString(),
            },
          );
        }
      }
    }

    const [data, total] = await qb.getManyAndCount();

    return buildPaginatedResponse(data, total, p, l);
  }

  // Servir imagen binaria desde la BD
  async getImageByProductId(
    productId: string,
  ): Promise<{ data: Buffer; mimetype?: string; size?: number } | null> {
    const product = await this.productsRepo.findOne({
      where: { id: productId },
      select: [
        'id',
        'image_data',
        'image_mime',
        'image_size',
      ] as (keyof Product)[],
    });

    if (!product || !product.image_data) return null;

    return {
      data: product.image_data,
      mimetype: product.image_mime ?? undefined,
      size: product.image_size ?? product.image_data.length,
    };
  }

  // Borrar imagen (con verificación de ownership)
  async deleteImageForUser(id: string, userId: string) {
    const product = await this.findOneByUser(id, userId);
    product.image_data = null;
    product.image_filename = null;
    product.image_mime = null;
    product.image_size = null;
    product.image_uploaded_at = null;
    return this.productsRepo.save(product);
  }

  // Ajusta stock por delta (+ para aumentar, - para reducir).
  // Si se pasa queryRunner, usa ese manager (útil dentro de transacciones externas).
  // Si no se pasa, crea su propio queryRunner para la operación atómica.
  async adjustStockByDelta(
    productId: string,
    delta: number,
    queryRunner?: QueryRunner,
  ) {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new BadRequestException('Delta de stock inválido');
    }

    const needsOwnRunner = !queryRunner;
    let runner: QueryRunner | undefined = queryRunner;

    if (needsOwnRunner) {
      runner = this.dataSource.createQueryRunner();
      await runner.connect();
      await runner.startTransaction();
    }

    try {
      // obtener producto con bloqueo pesimista para evitar race conditions
      const prod = await runner!.manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!prod) throw new NotFoundException('Producto no encontrado');

      const current = Number(prod.stock ?? 0);
      const newStock = current + Number(delta);

      if (!Number.isFinite(newStock) || isNaN(newStock)) {
        throw new BadRequestException('Operación de stock inválida');
      }

      if (newStock < 0) {
        throw new BadRequestException('Stock insuficiente');
      }

      prod.stock = newStock;
      await runner!.manager.save(prod);

      if (needsOwnRunner) {
        await runner!.commitTransaction();
      }

      return prod;
    } catch (err) {
      if (needsOwnRunner && runner) {
        try {
          await runner.rollbackTransaction();
        } catch {
          /* empty */
        }
      }
      throw err;
    } finally {
      if (needsOwnRunner && runner) {
        try {
          await runner.release();
        } catch {
          /* empty */
        }
      }
    }
  }

  // Obtener valor total del inventario.
  // Si se pasa `companyId`, devuelve el total para esa compañía (verifica ownership si se provee `userId` y no es admin).
  // Si no se pasa `companyId`, sólo los admins pueden solicitar el total global.
  async getTotalInventoryValue(opts?: {
    companyId?: string;
    userId?: string;
    isAdmin?: boolean;
  }) {
    const companyId = opts?.companyId;

    if (companyId) {
      // si viene userId y no es admin -> validar ownership
      if (opts?.userId && !opts.isAdmin) {
        await validateCompanyOwnership(
          this.companyRepo,
          companyId,
          opts.userId,
        );
      } else {
        const company = await this.companyRepo.findOne({
          where: { id: companyId },
        });
        if (!company) throw new NotFoundException('Compañía no encontrada');
      }
    } else {
      // para total global, requerir admin cuando se llama con userId presente
      if (opts?.userId && !opts.isAdmin) {
        throw new ForbiddenException('Debes especificar companyId');
      }
    }

    const qb = this.productsRepo
      .createQueryBuilder('product')
      .select(['product.price', 'product.stock']);

    if (companyId) qb.where('product.companyId = :companyId', { companyId });

    const products = await qb.getMany();

    const total = products.reduce((acc, p) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const price = this.toNumber((p as any).price ?? 0, 0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const stock = this.toNumber((p as any).stock ?? 0, 0);
      return acc + price * stock;
    }, 0);

    // devolver con 2 decimales
    return { total: Number(total.toFixed(2)) };
  }
}

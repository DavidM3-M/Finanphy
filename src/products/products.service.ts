import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, DataSource, QueryRunner } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';

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
  async findAllByUser(userId: string) {
    return this.productsRepo
      .createQueryBuilder('product')
      .leftJoin('product.company', 'company')
      .where('company.userId = :userId', { userId })
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  // Cliente: ver catálogo público de una compañía
  async findAllByCompany(companyId: string) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    return this.productsRepo.find({
      where: { company: { id: companyId } },
      order: { name: 'ASC' },
    });
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
  private toNumber(value: any, fallback = 0): number {
    if (value === undefined || value === null || value === '') return fallback;
    return typeof value === 'number' ? value : Number(value);
  }

  // Vendedor: crear producto en una compañía
  async createForUser(dto: CreateProductDto, userId: string) {
    let company: Company;

    if ((dto as any).companyId) {
      company = await validateCompanyOwnership(
        this.companyRepo,
        (dto as any).companyId,
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
    const price = this.toNumber((dto as any).price, 0);
    const cost = this.toNumber((dto as any).cost, 0);
    const stock = this.toNumber((dto as any).stock, 0);

    // imageUrl puede ser string | null; si viene undefined -> mantener null
    const imageUrl =
      (dto as any).imageUrl === undefined ? null : (dto as any).imageUrl;

    const product = this.productsRepo.create({
      name: dto.name,
      sku: dto.sku,
      description: dto.description ?? null,
      category: dto.category ?? null,
      imageUrl: imageUrl,
      price,
      cost,
      stock,
      company,
      companyId: company.id,
    } as DeepPartial<Product>);

    // Guardar imagen si viene en DTO (dto.image expected: { buffer, filename, mimetype, size })
    if ((dto as any).image) {
      const img = (dto as any).image;
      (product as any).image_data = Buffer.from(img.buffer);
      (product as any).image_filename = img.filename ?? null;
      (product as any).image_mime = img.mimetype ?? null;
      (product as any).image_size = img.size ?? null;
      (product as any).image_uploaded_at = new Date();
    }

    return this.productsRepo.save(product);
  }

  // Vendedor: actualizar producto
  async updateForUser(id: string, dto: UpdateProductDto, userId: string) {
    const product = await this.findOneByUser(id, userId);

    // Solo actualizar campos que vienen en dto (incluso si vienen como null)
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.sku !== undefined) product.sku = dto.sku;
    if (dto.description !== undefined)
      product.description = dto.description ?? null;
    if (dto.category !== undefined) product.category = dto.category ?? null;
    if ((dto as any).imageUrl !== undefined)
      product.imageUrl = (dto as any).imageUrl ?? null;
    if ((dto as any).price !== undefined)
      product.price = this.toNumber((dto as any).price, product.price);
    if ((dto as any).cost !== undefined)
      product.cost = this.toNumber((dto as any).cost, product.cost);
    if ((dto as any).stock !== undefined)
      product.stock = this.toNumber((dto as any).stock, product.stock);

    // Si se subió nueva imagen, sobrescribir campos de imagen
    if ((dto as any).image) {
      const img = (dto as any).image;
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
  async findByCompany(companyId: string) {
    return this.productsRepo.find({
      where: { companyId },
      order: { name: 'ASC' },
    });
  }

  // Servir imagen binaria desde la BD
  async getImageByProductId(
    productId: string,
  ): Promise<{ data: Buffer; mimetype?: string; size?: number } | null> {
    const product = await this.productsRepo.findOne({
      where: { id: productId },
      select: ['id', 'image_data', 'image_mime', 'image_size'] as any,
    });

    if (!product || !product.image_data) return null;

    return {
      data: product.image_data as Buffer,
      mimetype: product.image_mime ?? undefined,
      size: product.image_size ?? (product.image_data as Buffer).length,
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
        } catch (_) {}
      }
      throw err;
    } finally {
      if (needsOwnRunner && runner) {
        try {
          await runner.release();
        } catch (_) {}
      }
    }
  }
}

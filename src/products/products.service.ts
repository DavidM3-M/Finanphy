import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
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
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
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
    const imageUrl = (dto as any).imageUrl === undefined ? null : (dto as any).imageUrl;

    const product = this.productsRepo.create({
      name: dto.name,
      sku: dto.sku,
      description: dto.description ?? null,
      category: dto.category ?? null,
      imageUrl: dto.imageUrl ?? null,
      price,
      cost,
      stock,
      company,
      companyId: company.id,
    }as DeepPartial <Product>); ;

    return this.productsRepo.save(product);
  }

  // Vendedor: actualizar producto
  async updateForUser(id: string, dto: UpdateProductDto, userId: string) {
    const product = await this.findOneByUser(id, userId);

    // Solo actualizar campos que vienen en dto (incluso si vienen como null)
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.sku !== undefined) product.sku = dto.sku;
    if (dto.description !== undefined) product.description = dto.description ?? null;
    if (dto.category !== undefined) product.category = dto.category ?? null;
    if ((dto as any).imageUrl !== undefined) product.imageUrl = (dto as any).imageUrl ?? null;
    if ((dto as any).price !== undefined) product.price = this.toNumber((dto as any).price, product.price);
    if ((dto as any).cost !== undefined) product.cost = this.toNumber((dto as any).cost, product.cost);
    if ((dto as any).stock !== undefined) product.stock = this.toNumber((dto as any).stock, product.stock);

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
}
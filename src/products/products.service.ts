import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  async findOneByUser(id: number, userId: string) {
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

  // Vendedor: crear producto en una compañía
  async createForUser(dto: CreateProductDto, userId: string) {
    let company: Company;

    if (dto.companyId) {
      company = await validateCompanyOwnership(this.companyRepo, dto.companyId, userId);
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
      throw new BadRequestException(`Ya existe un producto con el SKU ${dto.sku} en esta empresa`);
    }

    const product = this.productsRepo.create({
      name: dto.name,
      sku: dto.sku,
      description: dto.description,
      category: dto.category,
      imageUrl: dto.imageUrl,
      price: dto.price,
      cost: dto.cost,
      stock: dto.stock ?? 0,
      company,
      companyId: company.id,
    });

    return this.productsRepo.save(product);
  }

  // Vendedor: actualizar producto
  async updateForUser(id: number, dto: UpdateProductDto, userId: string) {
    const product = await this.findOneByUser(id, userId);

    product.name = dto.name ?? product.name;
    product.sku = dto.sku ?? product.sku;
    product.description = dto.description ?? product.description;
    product.category = dto.category ?? product.category;
    product.imageUrl = dto.imageUrl ?? product.imageUrl;
    product.price = dto.price ?? product.price;
    product.cost = dto.cost ?? product.cost;
    product.stock = dto.stock ?? product.stock;

    return this.productsRepo.save(product);
  }

  // Vendedor: eliminar producto
  async removeForUser(id: number, userId: string) {
    const product = await this.findOneByUser(id, userId);
    return this.productsRepo.remove(product);
  }
}
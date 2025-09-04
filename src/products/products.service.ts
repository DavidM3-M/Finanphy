// src/products/products.service.ts
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productsRepo.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
  try {
    const product = this.productsRepo.create(dto);
    return await this.productsRepo.save(product);
  } catch (error) {
    if (error.code === '23505') {
      // Código de error de Postgres para violación de restricción única
      throw new ConflictException('El SKU ya está registrado');
    }
    throw new InternalServerErrorException('Error al crear el producto');
  }
}


  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productsRepo.save(product);
  }

  async remove(id: number): Promise< {message: string}> {
    const product = await this.findOne(id);
    await this.productsRepo.remove(product);
    return {message: "Producto eliminado correctamente"}
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { MoreThan } from 'typeorm';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getCatalogByCompany(companyId: string) {
    return this.productRepo.find({
      where: {
        company: { id: companyId },
        isActive: true, // opcional: solo productos visibles
        stock: MoreThan(0), // opcional: solo productos con stock
      },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }
}
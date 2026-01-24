import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { MoreThan } from 'typeorm';
import {
  buildPaginatedResponse,
  parsePagination,
} from 'src/common/helpers/pagination';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getCatalogByCompany(companyId: string, page?: string, limit?: string) {
    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.productRepo.findAndCount({
      where: {
        company: { id: companyId },
        isActive: true, // opcional: solo productos visibles
        stock: MoreThan(0), // opcional: solo productos con stock
      },
      relations: ['company'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: l,
    });

    return buildPaginatedResponse(data, total, p, l);
  }
}

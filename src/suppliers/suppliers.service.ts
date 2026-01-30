import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async createForUser(dto: CreateSupplierDto, userId: string) {
    const company = await validateCompanyOwnership(
      this.companyRepo,
      dto.companyId,
      userId,
    );
    const supplier = this.suppliersRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      contact: dto.contact,
      address: dto.address,
      notes: dto.notes,
      companyId: company.id,
    });
    return this.suppliersRepo.save(supplier);
  }

  async findAllForUser(userId: string, companyId?: string) {
    let companyIds: string[] = [];
    if (companyId) {
      const company = await validateCompanyOwnership(
        this.companyRepo,
        companyId,
        userId,
      );
      companyIds = [company.id];
    } else {
      const companies = await this.companyRepo.find({ where: { userId } });
      companyIds = companies.map((c) => c.id);
    }
    if (companyIds.length === 0) return [];
    return this.suppliersRepo.find({
      where: companyIds.map((id) => ({ companyId: id })),
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const supplier = await this.suppliersRepo.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    const company = await this.companyRepo.findOne({
      where: { id: supplier.companyId },
    });
    if (!company) throw new ForbiddenException('Empresa no encontrada');
    if (company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este proveedor');
    return supplier;
  }

  async updateForUser(id: string, dto: UpdateSupplierDto, userId: string) {
    const supplier = await this.findOneForUser(id, userId);
    if (!Object.keys(dto).length)
      throw new BadRequestException('No update values provided');
    supplier.name = dto.name ?? supplier.name;
    supplier.email = dto.email ?? supplier.email;
    supplier.phone = dto.phone ?? supplier.phone;
    supplier.contact = dto.contact ?? supplier.contact;
    supplier.address = dto.address ?? supplier.address;
    supplier.notes = dto.notes ?? supplier.notes;
    return this.suppliersRepo.save(supplier);
  }

  async removeForUser(id: string, userId: string) {
    const supplier = await this.findOneForUser(id, userId);
    return this.suppliersRepo.remove(supplier);
  }
}

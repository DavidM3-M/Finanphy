import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async createForUser(dto: CreateCustomerDto, userId: string) {
    const company = await validateCompanyOwnership(
      this.companyRepo,
      dto.companyId,
      userId,
    );

    const customer = this.customersRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      documentId: dto.documentId,
      address: dto.address,
      notes: dto.notes,
      companyId: company.id,
    });

    return this.customersRepo.save(customer);
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

    return this.customersRepo.find({
      where: companyIds.map((id) => ({ companyId: id })),
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const customer = await this.customersRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const company = await this.companyRepo.findOne({
      where: { id: customer.companyId },
    });

    if (!company) throw new ForbiddenException('Empresa no encontrada');
    if (company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este cliente');

    return customer;
  }

  async updateForUser(id: string, dto: UpdateCustomerDto, userId: string) {
    const customer = await this.findOneForUser(id, userId);

    if (!Object.keys(dto).length) {
      throw new BadRequestException('No update values provided');
    }

    customer.name = dto.name ?? customer.name;
    customer.email = dto.email ?? customer.email;
    customer.phone = dto.phone ?? customer.phone;
    customer.documentId = dto.documentId ?? customer.documentId;
    customer.address = dto.address ?? customer.address;
    customer.notes = dto.notes ?? customer.notes;

    return this.customersRepo.save(customer);
  }

  async removeForUser(id: string, userId: string) {
    const customer = await this.findOneForUser(id, userId);
    return this.customersRepo.remove(customer);
  }
}

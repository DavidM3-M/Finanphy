import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
  ) {}

  // ✅ Crear empresa asociada al usuario autenticado
  async create(dto: CreateCompanyDto, userId: number) {
    const existing = await this.repo.findOne({ where: { taxId: dto.taxId } });
    if (existing) {
      throw new BadRequestException('A company with this tax ID already exists');
    }

    const user = new UserEntity();
    user.id = userId;

    const company = this.repo.create({
      ...dto,
      user,
    });

    return this.repo.save(company);
  }

  // ✅ Obtener todas las empresas del usuario autenticado
  async findAllByUser(userId: number) {
    return this.repo.find({
      where: { userId },
      relations: ['incomes', 'expenses', 'investments', 'products'],
    });
  }

  // ✅ Obtener empresa por ID (sin validar propiedad)
  async findById(id: number) {
    const company = await this.repo.findOne({
      where: { id },
      relations: ['incomes', 'expenses', 'investments', 'products', 'user'],
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  // ✅ Actualizar empresa solo si pertenece al usuario
  async update(id: number, dto: UpdateCompanyDto, userId: number) {
    if (!Object.keys(dto).length) {
      throw new BadRequestException('No update values provided');
    }

    const company = await this.repo.findOneBy({ id, userId });
    if (!company) {
      throw new ForbiddenException('No tienes acceso a esta compañía');
    }

    await this.repo.update(id, dto);
    return this.repo.findOneBy({ id });
  }

  // ✅ Eliminar empresa solo si pertenece al usuario
  async delete(id: number, userId: number) {
    const company = await this.repo.findOneBy({ id, userId });
    if (!company) {
      throw new ForbiddenException('No tienes acceso a esta compañía');
    }

    return this.repo.delete(id);
  }
}
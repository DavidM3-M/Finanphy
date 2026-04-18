import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Investment } from '../entities/investment.entity';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';
import {
  buildPaginatedResponse,
  parsePagination,
} from 'src/common/helpers/pagination';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private investmentsRepository: Repository<Investment>,

    private readonly dataSource: DataSource,
  ) {}

  async create(data: CreateInvestmentDto) {
    const [row] = await this.dataSource.query<Investment[]>(
      `SELECT * FROM sp_create_investment($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.amount,
        data.category,
        (data as any).companyId ?? null,
        data.invoiceNumber ?? null,
        data.entryDate ? new Date(data.entryDate) : null,
        data.exitDate ? new Date(data.exitDate) : null,
        data.dueDate ? new Date(data.dueDate) : null,
      ],
    );
    return row;
  }

  async findAll(page?: string, limit?: string) {
    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.investmentsRepository.findAndCount({
      skip: offset,
      take: l,
      order: { createdAt: 'DESC' },
    });

    return buildPaginatedResponse(data, total, p, l);
  }

  async findOne(id: number) {
    const investment = await this.investmentsRepository.findOne({
      where: { id },
    });
    if (!investment)
      throw new NotFoundException(`Inversión con ID ${id} no encontrada`);
    return investment;
  }

  async remove(id: number) {
    // Verificar existencia antes de eliminar
    await this.findOne(id);

    await this.dataSource.query(`SELECT sp_delete_investment($1)`, [id]);

    return { message: 'Inversión eliminada correctamente' };
  }

  async update(id: number, dto: UpdateInvestmentDto) {
    // Verificar existencia antes de actualizar
    await this.findOne(id);

    const [row] = await this.dataSource.query<Investment[]>(
      `SELECT * FROM sp_update_investment($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        dto.amount ?? null,
        dto.category ?? null,
        dto.invoiceNumber ?? null,
        dto.entryDate ? new Date(dto.entryDate) : null,
        dto.exitDate ? new Date(dto.exitDate) : null,
        dto.dueDate ? new Date(dto.dueDate) : null,
      ],
    );

    return row;
  }
}

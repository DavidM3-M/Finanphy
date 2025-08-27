// src/expenses/services/expenses.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  // Crear un nuevo gasto
  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    try {
      const expense = this.expenseRepository.create(createExpenseDto);
      return await this.expenseRepository.save(expense);
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el gasto');
    }
  }

  // Obtener todos los gastos
  async findAll(): Promise<Expense[]> {
    try {
      return await this.expenseRepository.find({
        order: { date: 'DESC' } // Ordenar por fecha más reciente
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los gastos');
    }
  }

  // Obtener un gasto por ID
  async findOne(id: number): Promise<Expense> {
    try {
      const expense = await this.expenseRepository.findOne({ where: { id } });
      
      if (!expense) {
        throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
      }
      
      return expense;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener el gasto');
    }
  }

  // Actualizar un gasto
  async update(id: number, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    try {
      // Primero verificamos que el gasto exista
      await this.findOne(id);
      
      // Actualizamos el gasto
      await this.expenseRepository.update(id, updateExpenseDto);
      
      // Retornamos el gasto actualizado
      return await this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el gasto');
    }
  }

  // Eliminar un gasto
  async remove(id: number): Promise<void> {
    try {
      // Verificamos que el gasto exista
      await this.findOne(id);
      
      // Eliminamos el gasto
      const result = await this.expenseRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el gasto');
    }
  }

  // Método adicional: Obtener total de gastos por categoría
  async getTotalByCategory(): Promise<{ category: string; total: number }[]> {
    try {
      const query = `
        SELECT category, SUM(amount) as total 
        FROM expenses 
        GROUP BY category 
        ORDER BY total DESC
      `;
      
      return await this.expenseRepository.query(query);
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener total por categoría');
    }
  }
}
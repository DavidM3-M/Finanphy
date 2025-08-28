// src/inventory/inventory.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement } from './movement.entity';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly inventoryRepo: Repository<InventoryMovement>,
  ) {}

  async findAll(): Promise<InventoryMovement[]> {
    return this.inventoryRepo.find();
  }

  async findByProduct(productId: number): Promise<InventoryMovement[]> {
    const movements = await this.inventoryRepo.find({ where: { productId } });
    if (movements.length === 0) {
      throw new NotFoundException('No hay movimientos para este producto');
    }
    return movements;
  }

  async create(dto: CreateMovementDto): Promise<InventoryMovement> {
    const movement = this.inventoryRepo.create(dto);
    return this.inventoryRepo.save(movement);
  }
}

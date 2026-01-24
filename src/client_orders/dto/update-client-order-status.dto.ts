// src/client-orders/dto/update-client-order-status.dto.ts
import { IsEnum } from 'class-validator';

export enum ClientOrderStatus {
  Recibido = 'recibido',
  EnProceso = 'en_proceso',
  Enviado = 'enviado',
}

export class UpdateClientOrderStatusDto {
  @IsEnum(ClientOrderStatus)
  status: ClientOrderStatus;
}

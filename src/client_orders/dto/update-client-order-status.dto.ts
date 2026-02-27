// src/client-orders/dto/update-client-order-status.dto.ts
import { IsEnum } from 'class-validator';

export enum ClientOrderStatus {
  SinEnviar = 'sin_enviar',
  Enviado = 'enviado',
}

export class UpdateClientOrderStatusDto {
  @IsEnum(ClientOrderStatus)
  status: ClientOrderStatus;
}

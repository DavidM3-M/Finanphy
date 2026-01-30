import { BadRequestException } from '@nestjs/common';

export interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(
  pageRaw?: string | number,
  limitRaw?: string | number,
  options: PaginationOptions = {},
): PaginationParams {
  const defaultPage = options.defaultPage ?? 1;
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;

  const toInt = (value: string | number | undefined, fallback: number) => {
    if (value === undefined || value === null || value === '') return fallback;
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN;
    return n;
  };

  const page = toInt(pageRaw as any, defaultPage);
  const limit = toInt(limitRaw as any, defaultLimit);

  if (!Number.isFinite(page) || page <= 0) {
    throw new BadRequestException('page debe ser un entero positivo');
  }

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new BadRequestException('limit debe ser un entero positivo');
  }

  if (limit > maxLimit) {
    throw new BadRequestException(`limit no puede exceder ${maxLimit}`);
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): { data: T[]; meta: PaginationMeta } {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    meta: { page, limit, total, totalPages },
  };
}

import { TableColumnOptions } from 'typeorm';

export function createColumn(
  options: Partial<TableColumnOptions>,
): TableColumnOptions {
  return {
    name: options.name ?? 'unnamed',
    type: options.type ?? 'varchar',
    isPrimary: options.isPrimary ?? false,
    isGenerated: options.isGenerated ?? false,
    generationStrategy: options.generationStrategy ?? undefined,
    isNullable: options.isNullable ?? false,
    isUnique: options.isUnique ?? false,
    isArray: options.isArray ?? false,
    default: options.default ?? undefined,
    length: options.length ?? '',
    precision: options.precision ?? undefined,
    scale: options.scale ?? undefined,
    comment: options.comment ?? '',
  };
}

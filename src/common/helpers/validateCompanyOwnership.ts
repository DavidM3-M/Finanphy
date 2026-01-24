import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';

export async function validateCompanyOwnership(
  companyRepo: Repository<Company>,
  companyId: string,
  userId: string,
  allowedRoles: string[] = [],
  userRole?: string,
): Promise<Company> {
  const company = await companyRepo.findOne({ where: { id: companyId } });

  if (!company) {
    throw new ForbiddenException('Empresa no encontrada');
  }

  const isOwner = company.userId === userId;
  const isPrivileged = allowedRoles.includes(userRole ?? '');

  if (!isOwner && !isPrivileged) {
    throw new ForbiddenException('No tienes acceso a esta empresa');
  }

  return company;
}

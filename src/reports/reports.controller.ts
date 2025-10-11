import {
  Controller,
  Get,
  Req,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { MonthlyReportDto } from './dto/monthly-report.dto';

@Controller('feedback')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @Roles(Role.User, Role.Admin)
  async getMonthlyReport(
    @Req() req,
    @CurrentUser() currentUser: any,
    @Query('period') period?: string,
    @Query('topN') topNQuery?: string,
    @Query('companyId') companyIdQuery?: string,
    @Query('showProducts') _showProductsRaw?: string, // kept for compatibility but ignored
    @Query('orderStatus') orderStatus?: string,
  ): Promise<MonthlyReportDto> {
    this.logger.debug(`req.user raw: ${JSON.stringify(req.user)}`);

    if (!currentUser) {
      throw new ForbiddenException('User not authenticated properly');
    }

    // Prioridad: Header X-Company-Id -> token claim -> query param (solo Admin)
    const headerCompanyId = (req.headers['x-company-id'] ?? req.headers['x-company-Id']) as
      | string
      | undefined;
    const tokenCompanyId =
      currentUser?.companyId ?? currentUser?.company?.id ?? currentUser?.company_id;
    let targetCompanyId: string | undefined;

    if (headerCompanyId && String(headerCompanyId).trim() !== '') {
      targetCompanyId = String(headerCompanyId).trim();
    } else if (tokenCompanyId && String(tokenCompanyId).trim() !== '') {
      targetCompanyId = String(tokenCompanyId).trim();
    } else if (companyIdQuery) {
      const role = currentUser?.role ?? currentUser?.roles;
      if (role !== Role.Admin) {
        throw new ForbiddenException('No tienes permisos para solicitar el reporte de otra compañía');
      }
      const candidate = String(companyIdQuery).trim();
      if (!candidate) throw new BadRequestException('El companyId proporcionado no es válido');
      targetCompanyId = candidate;
    } else {
      throw new BadRequestException(
        'companyId faltante: pásalo en header X-Company-Id, en el token o como query (Admin)',
      );
    }

    // Validate period
    if (period) {
      const parts = period.split('-');
      if (
        parts.length !== 2 ||
        parts[0].length !== 4 ||
        isNaN(Number(parts[0])) ||
        isNaN(Number(parts[1]))
      ) {
        throw new BadRequestException('period debe tener formato YYYY-MM');
      }
    }

    // Parse topN
    let topN: number | undefined;
    if (topNQuery !== undefined && topNQuery !== null && topNQuery !== '') {
      const parsed = Number(topNQuery);
      if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        throw new BadRequestException('topN debe ser un entero positivo');
      }
      topN = parsed;
    }

    this.logger.debug(
      `Generating monthly report for company=${targetCompanyId} period=${period} topN=${topN} orderStatus=${orderStatus}`,
    );

    // Always return the full report produced by the service (no suppression)
    const report = await this.reportsService.generateMonthlyReportForCompany(targetCompanyId, {
      period,
      topN,
      requesterId: String(currentUser.id),
      orderStatus: orderStatus ?? 'enviado',
    });

    return report;
  }
}
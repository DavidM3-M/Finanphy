import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ReportsRepository } from './reports.repository';
import { MonthlyReportDto } from './dto/monthly-report.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly repo: ReportsRepository,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async generateMonthlyReportForCompany(
    companyId: string,
    opts?: {
      period?: string;
      topN?: number;
      requesterId?: string;
      orderStatus?: string;
    },
  ): Promise<MonthlyReportDto> {
    const period = opts?.period ?? this.currentMonthKey();
    const topN = opts?.topN ?? 10;
    const requesterId = opts?.requesterId ?? companyId;
    const statusToConsider = opts?.orderStatus ?? 'enviado';

    const { start, end } = this.periodBoundaries(period);
    const prevStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
    const prevEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

    const fromIso = start.toISOString();
    const toIso = end.toISOString();
    const prevFromIso = prevStart.toISOString();
    const prevToIso = prevEnd.toISOString();

    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    this.logger.debug(`ReportsService: generating for company=${companyId} period=${period} status=${statusToConsider} requester=${requesterId}`);

    // Aggregation by orders (only orders with given status)
    const [agg, aggPrev] = await Promise.all([
      this.repo.getCompanyProductByOrderCount(companyId, fromIso, toIso, statusToConsider),
      this.repo.getCompanyProductByOrderCount(companyId, prevFromIso, prevToIso, statusToConsider),
    ]);

    this.logger.debug(`ReportsService: agg rows=${(agg || []).length} aggPrev rows=${(aggPrev || []).length}`);
    this.logger.debug(`ReportsService: sample agg=${JSON.stringify((agg || []).slice(0,5))}`);

    // Build grouped data from aggregation
    const grouped = (agg || []).map((r: any) => ({
      id: r.product_id ?? null,
      name: r.product_name ?? 'Sin producto',
      ordersCount: Number(r.orders_count || 0),
      quantity: Number(r.total_qty || 0),
      revenue: Number(r.total_revenue || 0),
      cost: Number(r.total_cost || 0),
    }));

    const groupedPrevRevenue = (aggPrev || []).reduce((s: number, r: any) => s + Number(r.total_revenue || 0), 0);

    const totalIncome = grouped.reduce((s, g) => s + g.revenue, 0);
    const costTotal = grouped.reduce((s, g) => s + g.cost, 0);
    const salesCount = grouped.reduce((s, g) => s + g.ordersCount, 0);

    // Sort and build top/bottom by ordersCount (tie-breaker revenue -> quantity -> id)
    const sortedByOrdersDesc = [...grouped].sort((a, b) =>
      b.ordersCount - a.ordersCount ||
      b.revenue - a.revenue ||
      b.quantity - a.quantity ||
      String(a.id ?? '').localeCompare(String(b.id ?? '')),
    );
    const sortedByOrdersAsc = [...grouped].sort((a, b) =>
      a.ordersCount - b.ordersCount ||
      b.revenue - a.revenue ||
      b.quantity - a.quantity ||
      String(a.id ?? '').localeCompare(String(b.id ?? '')),
    );

    const topProductsComputed = sortedByOrdersDesc.slice(0, topN).map(p => ({
      id: p.id,
      name: p.name,
      orders: p.ordersCount,
      quantity: p.quantity,
      revenue: p.revenue,
    }));

    const bottomProductsComputed = sortedByOrdersAsc.slice(0, topN).map(p => ({
      id: p.id,
      name: p.name,
      orders: p.ordersCount,
      quantity: p.quantity,
      revenue: p.revenue,
    }));

    // Profitability
    let profitabilityPct: number | null;
    if (totalIncome === 0) {
      profitabilityPct = null;
    } else if (costTotal === 0) {
      profitabilityPct = null;
    } else {
      profitabilityPct = Number((((totalIncome - costTotal) / totalIncome) * 100).toFixed(2));
    }

    // Resolve product details for cost validation (best-effort)
    const productIds = grouped.map(g => g.id).filter(Boolean) as string[];
    const missingCostProductIds = new Set<string>();
    if (productIds.length) {
      try {
        const products = await this.productRepo.find({ where: { id: In(productIds) } });
        const prodMap = new Map<string, Product>();
        products.forEach(p => prodMap.set(String((p as any).id), p));
        grouped.forEach(g => {
          if (!g.id) return;
          const prod = prodMap.get(String(g.id));
          if (!prod) {
            missingCostProductIds.add(String(g.id));
            return;
          }
          const unitCost = safeNum((prod as any).cost ?? 0);
          if (unitCost === 0) missingCostProductIds.add(String(g.id));
        });
      } catch (err) {
        this.logger.warn('Failed to resolve products for cost verification', err?.message ?? err);
        productIds.forEach(id => missingCostProductIds.add(id));
      }
    }

    const notes: string[] = ['Report generated by companyId'];
    if (missingCostProductIds.size > 0) {
      notes.push(`${missingCostProductIds.size} product(s) missing cost info; profitability may be incomplete`);
    }

    const previousComparison = this.buildPreviousComparison(groupedPrevRevenue, totalIncome);

    const suggestions = bottomProductsComputed.slice(0, 3).map(p => `Consider promoting ${p.name || 'unnamed product'} (sold ${p.quantity}).`);
    const goals = [
      { label: 'Revenue target', target: Math.round(totalIncome * 1.05), unit: 'currency' as const, rationale: '5% uplift' },
      { label: 'Profitability target', target: 5, unit: 'percent' as const, rationale: 'Improve margin by 5 p.p.' },
    ];

    // Expose product-level details (controller will hide for non-privileged users)
    const salesByProduct = grouped.map(g => ({ name: g.name, quantity: g.quantity, revenue: g.revenue }));
    const topProducts = topProductsComputed.map(p => ({ id: p.id, name: p.name, quantity: p.quantity, revenue: p.revenue }));
    const bottomProducts = bottomProductsComputed.map(p => ({ id: p.id, name: p.name, quantity: p.quantity, revenue: p.revenue }));

    return {
      userId: requesterId,
      companyId,
      period,
      generatedAt: new Date().toISOString(),
      revenueTotal: totalIncome,
      profitabilityPct,
      salesCount,
      salesByProduct,
      topProducts,
      bottomProducts,
      suggestions,
      goals,
      previousMonthComparison: previousComparison,
      notes,
    } as MonthlyReportDto;
  }

  private currentMonthKey(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private periodBoundaries(period: string): { start: Date; end: Date } {
    const [y, m] = period.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1 + 1, 1, 0, 0, 0));
    return { start, end };
  }

  private buildPreviousComparison(prevRevenue: number, currentRevenue: number) {
    let variationPct: number | null;
    if (prevRevenue === 0) {
      variationPct = currentRevenue === 0 ? 0 : null;
    } else {
      variationPct = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    }
    return { revenue: Number(prevRevenue), variationPct: variationPct === null ? null : Number(variationPct.toFixed(2)) };
  }
}
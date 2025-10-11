// src/reports/reports.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ReportsRepository, TxRow } from './reports.repository';
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
    opts?: { period?: string; topN?: number; requesterId?: string },
  ): Promise<MonthlyReportDto> {
    const period = opts?.period ?? this.currentMonthKey();
    const topN = opts?.topN ?? 10;
    const requesterId = opts?.requesterId ?? companyId;

    const { start, end } = this.periodBoundaries(period);
    const prevStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
    const prevEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

    const fromIso = start.toISOString();
    const toIso = end.toISOString();
    const prevFromIso = prevStart.toISOString();
    const prevToIso = prevEnd.toISOString();

    const [txs, prevTxs] = await Promise.all([
      this.repo.getCompanyTransactionsForMonth(companyId, fromIso, toIso),
      this.repo.getCompanyTransactionsForMonth(companyId, prevFromIso, prevToIso),
    ]);

    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const byProduct = new Map<
      string,
      { productId: string | null; productName?: string | null; quantity: number; revenue: number }
    >();

    let totalIncome = 0;
    let totalExpense = 0;
    let salesCount = 0;

    (txs || []).forEach((t: TxRow) => {
      if (t.type === 'income') {
        const key = t.product_id ?? '__no_product__';
        const entry =
          byProduct.get(key) ??
          ({
            productId: t.product_id ?? null,
            productName: t.product_name ?? null,
            quantity: 0,
            revenue: 0,
          } as { productId: string | null; productName?: string | null; quantity: number; revenue: number });

        const quantity = (t as any).quantity != null ? Math.max(0, Math.floor(safeNum((t as any).quantity))) : 1;
        entry.quantity += quantity;
        entry.revenue += safeNum(t.amount);
        byProduct.set(key, entry);

        totalIncome += safeNum(t.amount);
        salesCount += quantity;
      } else {
        totalExpense += safeNum(t.amount);
      }
    });

    const prevRevenue = (prevTxs || []).reduce(
      (s: number, r: TxRow) => s + (r.type === 'income' ? safeNum(r.amount) : 0),
      0,
    );

    // Resolve product details (name, cost)
    const productIds = Array.from(byProduct.values()).map(v => v.productId).filter(Boolean) as string[];
    let costTotal = 0;
    const missingCostProductIds = new Set<string>();

    if (productIds.length) {
      try {
        const products = await this.productRepo.find({ where: { id: In(productIds) } });
        const prodMap = new Map<string, Product>();
        products.forEach(p => prodMap.set(String((p as any).id), p));

        for (const [key, val] of byProduct.entries()) {
          if (!val.productId) {
            if (!val.productName) val.productName = 'Sin producto';
            continue;
          }
          const prod = prodMap.get(String(val.productId));
          if (prod) {
            const unitCost = safeNum((prod as any).cost ?? 0);
            if (unitCost === 0) missingCostProductIds.add(String(val.productId));
            costTotal += unitCost * val.quantity;
            if (!val.productName) val.productName = (prod as any).name ?? 'Sin producto';
          } else {
            missingCostProductIds.add(String(val.productId));
            if (!val.productName) val.productName = 'Sin producto';
          }
        }
      } catch (err) {
        this.logger.warn('Failed to resolve products for cost calculation', err?.message ?? err);
        productIds.forEach(id => missingCostProductIds.add(id));
      }
    } else {
      // ensure items without product have a display name
      byProduct.forEach(v => { if (!v.productName) v.productName = 'Sin producto'; });
    }

    const grouped = Array.from(byProduct.values()).map(g => ({
      id: g.productId,
      name: g.productName ?? 'Sin producto',
      quantity: g.quantity,
      revenue: Number(g.revenue || 0),
    }));

    const sortedByRevenueDesc = [...grouped].sort((a, b) =>
      b.revenue !== a.revenue ? b.revenue - a.revenue : b.quantity !== a.quantity ? b.quantity - a.quantity : String(a.id ?? '').localeCompare(String(b.id ?? '')),
    );
    const sortedByRevenueAsc = [...grouped].sort((a, b) =>
      a.revenue !== b.revenue ? a.revenue - b.revenue : b.quantity !== a.quantity ? b.quantity - a.quantity : String(a.id ?? '').localeCompare(String(b.id ?? '')),
    );

    const topProducts = sortedByRevenueDesc.slice(0, topN).map(p => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      revenue: Number(p.revenue || 0),
    }));

    const bottomProducts = sortedByRevenueAsc.slice(0, topN).map(p => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      revenue: Number(p.revenue || 0),
    }));

    let profitabilityPct: number | null;
    if (totalIncome === 0) {
      profitabilityPct = null;
    } else if (costTotal === 0) {
      profitabilityPct = null;
    } else {
      profitabilityPct = Number((((totalIncome - costTotal) / totalIncome) * 100).toFixed(2));
    }

    const notes = ['Report generated by companyId'];
    if (missingCostProductIds.size > 0) {
      notes.push(`${missingCostProductIds.size} product(s) missing cost info; profitability may be incomplete`);
    }

    const previousComparison = this.buildPreviousComparison(prevRevenue, totalIncome);
    const suggestions = bottomProducts.slice(0, 3).map(p => `Consider promoting ${p.name || 'unnamed product'} (sold ${p.quantity}).`);
    const goals = [
      { label: 'Revenue target', target: Math.round(totalIncome * 1.05), unit: 'currency' as const, rationale: '5% uplift' },
      { label: 'Profitability target', target: 5, unit: 'percent' as const, rationale: 'Improve margin by 5 p.p.' },
    ];

    return {
      userId: requesterId,
      companyId,
      period,
      generatedAt: new Date().toISOString(),
      revenueTotal: totalIncome,
      profitabilityPct,
      salesCount,
      salesByProduct: grouped.map(g => ({ name: g.name, quantity: g.quantity, revenue: g.revenue })),
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
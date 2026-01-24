// src/reports/reports.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

export type TxRow = {
  id: string;
  company_id: string;
  product_id: string | null;
  amount: number;
  currency?: string;
  createdAt: string;
  type: 'income' | 'expense';
  product_name?: string | null;
};

@Injectable()
export class ReportsRepository {
  private readonly logger = new Logger(ReportsRepository.name);
  constructor(private readonly db: DbService) {}

  async getCompanyProductByOrderCount(
    companyId: string,
    fromIso: string,
    toIso: string,
    status = 'enviado',
  ) {
    const sql = `
                SELECT
        COALESCE(oi."productId"::text, '__no_product__') AS product_key,
        CASE WHEN oi."productId" IS NULL THEN NULL ELSE oi."productId"::text END AS product_id,
        p.name AS product_name,
        COUNT(DISTINCT oi."orderId") AS orders_count,
        SUM(COALESCE(oi.quantity, 1)) AS total_qty,
        SUM(COALESCE(oi.quantity, 1) * COALESCE(oi."unitPrice", 0)) AS total_revenue,
        SUM(COALESCE(oi.quantity, 1) * COALESCE(p.cost, 0)) AS total_cost
        FROM public.client_order_items oi
        JOIN public.client_orders o ON o.id = oi."orderId"
        LEFT JOIN public.product p ON p.id = oi."productId"
        WHERE o."companyId" = $1
        AND o."createdAt" >= $2::timestamptz
        AND o."createdAt" <  $3::timestamptz
        AND o.status = $4
        GROUP BY product_key, product_id, p.name;
    `;
    const res = await this.db.query(sql, [companyId, fromIso, toIso, status]);
    return res.rows || res;
  }

  async getCompanyTransactionsForMonth(
    companyId: string,
    fromIso: string,
    toIso: string,
  ): Promise<TxRow[]> {
    if (!companyId || String(companyId).trim() === '') {
      this.logger.warn(
        'getCompanyTransactionsForMonth called with null/empty companyId; returning []',
      );
      return [];
    }
    const cid = String(companyId).trim();

    const q = `
      SELECT id::text,
             "companyId"::text AS company_id,
             NULL::text AS product_id,
             COALESCE(amount::numeric,0) AS amount,
             COALESCE(NULL::text,'') AS currency,
             "createdAt" AT TIME ZONE 'UTC' AS "createdAt",
             'income'::text AS type
      FROM income
      WHERE "companyId"::text = $1 AND "createdAt" >= $2::timestamptz AND "createdAt" < $3::timestamptz

      UNION ALL

      SELECT id::text,
             "companyId"::text AS company_id,
             NULL::text AS product_id,
             COALESCE(amount::numeric,0) AS amount,
             COALESCE(NULL::text,'') AS currency,
             "createdAt" AT TIME ZONE 'UTC' AS "createdAt",
             'expense'::text AS type
      FROM expense
      WHERE "companyId"::text = $1 AND "createdAt" >= $2::timestamptz AND "createdAt" < $3::timestamptz

      ORDER BY "createdAt" ASC
    `;
    const res = await this.db.query(q, [cid, fromIso, toIso]);

    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const rows = (res.rows || []).map((r: any) => ({
      id: String(r.id),
      company_id: String(r.company_id),
      product_id: r.product_id ?? null,
      amount: safeNum(r.amount),
      currency: r.currency ?? '',
      createdAt: r.createdAt,
      type: r.type === 'income' ? 'income' : 'expense',
    })) as TxRow[];

    // If you have products referenced by product_id, resolve names.
    // In your schema product table may not exist; guard the lookup.
    const productIds = Array.from(
      new Set(rows.map((r) => r.product_id).filter(Boolean)),
    );
    if (productIds.length) {
      try {
        const pRes = await this.db.query(
          `SELECT id::text, name FROM product WHERE id = ANY($1::uuid[])`,
          [productIds],
        );
        const map = new Map<string, string>();
        pRes.rows.forEach((p: any) => map.set(String(p.id), p.name));
        rows.forEach((r) => {
          if (r.product_id)
            r.product_name = map.get(r.product_id) ?? 'Sin producto';
        });
      } catch (err) {
        this.logger.warn(
          'No se pudo resolver product names; continuing without them',
          err?.message,
        );
      }
    }

    return rows;
  }
}

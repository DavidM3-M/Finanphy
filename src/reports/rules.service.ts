// src/reports/rules.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';

export type PeriodRange = { fromIso: string; toIso: string };

@Injectable()
export class RulesService {
  /**
   * Parse a period string YYYY-MM to ISO boundaries (UTC start inclusive, next-month start exclusive).
   * If no period provided returns current month range.
   */
  parsePeriod(period?: string): PeriodRange {
    if (!period) return this.currentMonthRange();

    const parts = period.split('-');
    if (parts.length !== 2) throw new BadRequestException('period must have format YYYY-MM');

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('period must have format YYYY-MM with valid month');
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }

  /**
   * Return normalized topN: default and enforced max limits.
   * Throws on invalid values.
   */
  normalizeTopN(top?: number | null, defaultN = 5, maxN = 50): number {
    if (top === undefined || top === null) return defaultN;
    if (!Number.isInteger(top) || top <= 0) throw new BadRequestException('topN must be a positive integer');
    return Math.min(top, maxN);
  }

  /**
   * Resolve which target user id to use depending on requester role.
   * Throws if unauthorized to query another user's data.
   */
  resolveTargetUserId(requesterId: number, requesterRole: string, userIdQuery?: number | string): number {
    if (userIdQuery === undefined || userIdQuery === null || userIdQuery === '') return requesterId;
    const parsed = Number(userIdQuery);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestException('userId must be a positive integer');
    if (requesterRole !== 'Admin') throw new UnauthorizedException('Not authorized to request other user reports');
    return parsed;
  }

  /**
   * Decide if a transaction should be included based on amount threshold or custom rule.
   */
  shouldIncludeTransaction(amount: number, minThreshold = 0.01): boolean {
    if (typeof amount !== 'number' || Number.isNaN(amount)) return false;
    return Math.abs(amount) >= Math.abs(minThreshold);
  }

  /**
   * Format amount consistently (rounding).
   */
  formatAmount(amount: number, decimals = 2): number {
    if (typeof amount !== 'number' || Number.isNaN(amount)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(amount * factor) / factor;
  }

  /**
   * Safe parse for incoming period query param (returns period key YYYY-MM).
   * If missing returns current month key.
   */
  getPeriodKey(period?: string): string {
    if (!period) return this.currentMonthKey();
    const { fromIso } = this.parsePeriod(period); // will validate
    const d = new Date(fromIso);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private currentMonthRange(): PeriodRange {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }

  private currentMonthKey(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
}
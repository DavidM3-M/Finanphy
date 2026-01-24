// src/reports/dto/monthly-report.dto.ts
export type ProductSummary = {
  id: string | null;
  name: string;
  quantity: number;
  revenue: number;
};

export type GoalDto = {
  label: string;
  target: number;
  unit: 'currency' | 'percent';
  rationale?: string;
};

export type PreviousComparisonDto = {
  revenue: number;
  variationPct: number;
};

export type MonthlyReportDto = {
  userId: string | number;
  period: string;
  generatedAt: string;
  revenueTotal: number;
  profitabilityPct: number;
  salesCount: number;
  salesByProduct: { name: string; quantity: number; revenue: number }[];
  topProducts: ProductSummary[];
  bottomProducts: ProductSummary[];
  suggestions: string[];
  goals: GoalDto[];
  previousMonthComparison: PreviousComparisonDto;
  notes?: string[];
};

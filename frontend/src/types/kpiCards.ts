export type CardColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface BaseKpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: CardColor;
  isLoading?: boolean;
  formatValue?: (value: number) => string | number;
}

export interface KpiSummaryData {
  totalCount: number;
  humanCount: number;
  vehicleCount: number;
  vestViolationCount: number;
}

export interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  isLoading?: boolean;
  formatValue?: (value: number) => string;
}

export interface KpiSummaryData {
  totalCount: number;
  humanCount: number;
  vehicleCount: number;
  vestViolationCount: number;
}
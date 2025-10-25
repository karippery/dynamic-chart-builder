
import { useMemo } from 'react';
import { ChartData } from '../types/charts';
import { ChartDataTransformer } from '../utils/chartDataTransformer';

interface UseChartDataProps {
  chartData: ChartData | null;
  groupByFields: string[];
  metric: string;
}

export const useChartData = ({
  chartData,
  groupByFields,
  metric,
}: UseChartDataProps) => {
  return useMemo(() => {
    if (!chartData || !chartData.series || chartData.series.length === 0) {
      return null;
    }

    return ChartDataTransformer.transform(chartData, groupByFields, metric);
  }, [chartData, groupByFields, metric]);
};
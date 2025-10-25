
import React from 'react';
import { ChartData, ChartType } from '../../types/charts';
import { ChartConfigService } from '../../services/chartConfigService';
import { BaseChart } from '../tools/charts/BaseChart';
import { ChartRenderer } from '../tools/charts/ChartRenderer';
import { useChartData } from '../../hooks/useChartData';
import { useChartOptions } from '../../hooks/useChartOptions';

interface ChartVisualizationProps {
  chartData: ChartData | null;
  groupByFields: string[];
  metric: string;
  isLoading?: boolean;
  error?: string | null;
  onChartTypeChange?: (chartType: ChartType) => void;
  selectedChartType?: ChartType;
}

const ChartVisualization: React.FC<ChartVisualizationProps> = ({
  chartData,
  groupByFields,
  metric,
  isLoading = false,
  error = null,
  onChartTypeChange,
  selectedChartType,
}) => {
  const transformedData = useChartData({ chartData, groupByFields, metric });
  const isTimeBased = groupByFields.includes('time_bucket');
  
  const chartOptions = useChartOptions({
    groupByFields,
    metric,
    isTimeBased,
  });

  const { chartConfig, availableChartTypes } = React.useMemo(() => {
    if (!chartData) {
      return { chartConfig: null, availableChartTypes: [] as ChartType[] };
    }

    const config = ChartConfigService.getChartConfig(groupByFields, metric);
    const availableTypes = ChartConfigService.getAvailableChartTypes(groupByFields);

    return {
      chartConfig: config,
      availableChartTypes: availableTypes
    };
  }, [chartData, groupByFields, metric]);

  // Filter available chart types for time series data
  const getFilteredChartTypes = (): ChartType[] => {
    if (isTimeBased) {
      return ['line', 'bar']; // These are valid ChartType values
    }
    return availableChartTypes;
  };

  const currentChartType = selectedChartType || chartConfig?.type || 'bar';
  const filteredChartTypes = getFilteredChartTypes();

  const metadata = chartData?.meta ? {
    metric: chartData.meta.metric,
    bucket: chartData.meta.bucket,
    cached: chartData.meta.cached,
    totalRecords: transformedData?.datasets.reduce((total, dataset) => 
      total + dataset.data.reduce((sum: number, value: any) => sum + value, 0), 0
    ),
  } : undefined;

  return (
    <BaseChart
      title={chartConfig?.title || 'Chart'}
      chartData={chartData}
      isLoading={isLoading}
      error={error}
      onChartTypeChange={onChartTypeChange}
      selectedChartType={currentChartType}
      availableChartTypes={filteredChartTypes}
      metadata={metadata}
    >
      {transformedData && (
        <ChartRenderer
          chartType={currentChartType}
          data={transformedData}
          options={chartOptions}
        />
      )}
    </BaseChart>
  );
};

export default ChartVisualization;
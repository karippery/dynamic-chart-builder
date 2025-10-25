
import React from 'react';
import { Grid } from '@mui/material';
import { OverspeedEventsResponse, VestViolationsResponse } from '../../types/safety';
import { useChartOptions } from '../../hooks/useChartOptions';
import { BaseChart } from '../tools/charts/BaseChart';
import { ChartRenderer } from '../tools/charts/ChartRenderer';
import { ChartType } from '../../types/charts';


interface SafetyChartsProps {
  vestViolations: VestViolationsResponse | null;
  overspeedEvents: OverspeedEventsResponse | null;
  isLoading?: boolean;
}

export const SafetyCharts: React.FC<SafetyChartsProps> = ({
  vestViolations,
  overspeedEvents,
  isLoading = false
}) => {
  const chartOptions = useChartOptions({
    groupByFields: ['zone'],
    metric: 'count',
    isTimeBased: false,
  });

  // Prepare data for violations by zone chart
  const violationsByZoneData = React.useMemo(() => ({
    labels: vestViolations?.by_zone.map(item => `Zone ${item.zone}`) || [],
    datasets: [
      {
        label: 'Vest Violations',
        data: vestViolations?.by_zone.map(item => item.count) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  }), [vestViolations]);

  // Prepare data for overspeed events by object class
  const overspeedByClassData = React.useMemo(() => ({
    labels: overspeedEvents?.by_object_class.map(item => item.object_class) || [],
    datasets: [
      {
        label: 'Overspeed Events',
        data: overspeedEvents?.by_object_class.map(item => item.count) || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }), [overspeedEvents]);

  const violationsChartData = vestViolations ? {
    series: vestViolations.by_zone.map(item => ({
      zone: item.zone,
      value: item.count
    })),
    meta: {
      metric: 'count',
      bucket: 'zone',
      cached: false
    }
  } as any : null;

  const overspeedChartData = overspeedEvents ? {
    series: overspeedEvents.by_object_class.map(item => ({
      class: item.object_class,
      value: item.count
    })),
    meta: {
      metric: 'count',
      bucket: 'object_class',
      cached: false
    }
  } as any : null;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <BaseChart
          title="Vest Violations by Zone"
          chartData={violationsChartData}
          isLoading={isLoading}
          availableChartTypes={['bar'] as ChartType[]}
          height={300}
        >
          {violationsByZoneData && (
            <ChartRenderer
              chartType="bar"
              data={violationsByZoneData}
              options={chartOptions}
              height={300}
            />
          )}
        </BaseChart>
      </Grid>
      
      <Grid size={{ xs: 12, md: 6 }}>
        <BaseChart
          title="Overspeed Events by Object Class"
          chartData={overspeedChartData}
          isLoading={isLoading}
          availableChartTypes={['doughnut'] as ChartType[]}
          height={300}
        >
          {overspeedByClassData && (
            <ChartRenderer
              chartType="doughnut"
              data={overspeedByClassData}
              options={chartOptions}
              height={300}
            />
          )}
        </BaseChart>
      </Grid>
    </Grid>
  );
};
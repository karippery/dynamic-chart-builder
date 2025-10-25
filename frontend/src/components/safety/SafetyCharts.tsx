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
  objectClassFilter?: string;
}

export const SafetyCharts: React.FC<SafetyChartsProps> = ({
  vestViolations,
  overspeedEvents,
  isLoading = false,
  objectClassFilter = ''
}) => {
  // Prepare data for overspeed events by zone and object class
  const overspeedByZoneAndClassData = React.useMemo(() => {
    if (!overspeedEvents?.overspeed_events) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Filter by object class if specified
    let filteredEvents = overspeedEvents.overspeed_events;
    if (objectClassFilter) {
      filteredEvents = filteredEvents.filter(event => 
        event.object_class === objectClassFilter
      );
    }

    // Get unique zones and object classes
    const zones = filteredEvents.map(event => event.zone).filter((v, i, a) => a.indexOf(v) === i).sort();
    const objectClasses = filteredEvents.map(event => event.object_class).filter((v, i, a) => a.indexOf(v) === i).sort();

    // Create datasets for each object class
    const datasets = objectClasses.map((objectClass, index) => {
      const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ];

      // Count events for this object class in each zone
      const data = zones.map(zone => 
        filteredEvents.filter(event => 
          event.zone === zone && event.object_class === objectClass
        ).length
      );

      return {
        label: objectClass,
        data,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.6', '1'),
        borderWidth: 1,
      };
    });

    return {
      labels: zones.map(zone => `Zone ${zone}`),
      datasets,
    };
  }, [overspeedEvents, objectClassFilter]);

  // Chart data for BaseChart
  const overspeedChartData = overspeedEvents ? {
    series: overspeedByZoneAndClassData.labels.flatMap((zoneLabel, zoneIndex) => 
      overspeedByZoneAndClassData.datasets.map(dataset => ({
        zone: zoneLabel.replace('Zone ', ''),
        object_class: dataset.label,
        value: dataset.data[zoneIndex]
      }))
    ),
    meta: {
      metric: 'count',
      bucket: 'zone_object_class',
      cached: false
    }
  } as any : null;

  const chartOptions = useChartOptions({
    groupByFields: ['zone', 'object_class'],
    metric: 'count',
    isTimeBased: false,
  });

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <BaseChart
          title={`Overspeed Events ${objectClassFilter ? `- ${objectClassFilter}` : 'by Zone and Object Class'}`}
          chartData={overspeedChartData}
          isLoading={isLoading}
          availableChartTypes={['bar', 'line'] as ChartType[]}
          height={320}
        >
          {overspeedByZoneAndClassData && (
            <ChartRenderer
              chartType="bar"
              data={overspeedByZoneAndClassData}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  x: {
                    ...chartOptions.scales?.x,
                    title: {
                      display: true,
                      text: 'Zones'
                    }
                  },
                  y: {
                    ...chartOptions.scales?.y,
                    title: {
                      display: true,
                      text: 'Number of Overspeed Events'
                    },
                    beginAtZero: true
                  }
                },
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      title: (context: { label: string; }[]) => {
                        return `Zone ${context[0].label.replace('Zone ', '')}`;
                      },
                      label: (context: { dataset: any; parsed: { y: any; }; }) => {
                        const dataset = context.dataset;
                        const value = context.parsed.y;
                        return `${dataset.label}: ${value} event${value !== 1 ? 's' : ''}`;
                      }
                    }
                  }
                }
              }}
              height={400}
            />
          )}
        </BaseChart>
      </Grid>
    </Grid>
  );
};
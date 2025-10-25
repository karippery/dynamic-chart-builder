
import { useMemo } from 'react';
import { useTheme } from '@mui/material';

interface UseChartOptionsProps {
  groupByFields: string[];
  metric: string;
  isTimeBased?: boolean;
}

export const useChartOptions = ({
  groupByFields,
  metric,
  isTimeBased = false,
}: UseChartOptionsProps) => {
  const theme = useTheme();

  const getYAxisLabel = (metricType: string): string => {
    const labels: Record<string, string> = {
      count: 'Count',
      unique_ids: 'Unique Objects',
      avg_speed: 'Speed (m/s)',
      rate: 'Rate (/hour)',
    };
    return labels[metricType] || 'Value';
  };

  const getXAxisLabel = (fields: string[]): string => {
    if (fields.length === 0) return 'Category';
    const primaryField = fields[0];
    const labels: Record<string, string> = {
      time_bucket: 'Time',
      object_class: 'Object Class',
      zone: 'Zone',
      vest: 'Safety Vest',
    };
    return labels[primaryField] || primaryField;
  };

  return useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          display: true,
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          callbacks: {
            title: (context: any) => {
              if (isTimeBased) {
                const value = context[0].label;
                const date = new Date(value);
                return date.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
              }
              return context[0].label;
            }
          }
        },
      },
    };

    if (isTimeBased) {
      return {
        ...baseOptions,
        scales: {
          x: {
            type: 'time' as const,
            time: {
              unit: 'hour' as const,
              tooltipFormat: 'MMM dd, HH:mm',
              displayFormats: {
                hour: 'HH:mm',
                day: 'MMM dd',
              },
            },
            title: {
              display: true,
              text: 'Time',
            },
            grid: {
              color: theme.palette.divider,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              callback: function(value: any) {
                const date = new Date(value);
                return date.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                });
              }
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: getYAxisLabel(metric),
            },
            grid: {
              color: theme.palette.divider,
            },
          },
        },
      };
    }

    return {
      ...baseOptions,
      scales: {
        x: {
          grid: {
            color: theme.palette.divider,
          },
          title: {
            display: true,
            text: getXAxisLabel(groupByFields),
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: getYAxisLabel(metric),
          },
          grid: {
            color: theme.palette.divider,
          },
        },
      },
    };
  }, [theme, groupByFields, metric, isTimeBased]);
};
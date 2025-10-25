import React from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {  ChartType } from '../../../types/charts';

interface ChartRendererProps {
  chartType: ChartType;
  data: any;
  options: any;
  height?: number;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  chartType,
  data,
  options,
  height = 400,
}) => {
  const chartProps = {
    data,
    options,
    height,
  };

  switch (chartType) {
    case 'line':
      return <Line {...chartProps} />;
    case 'bar':
      return <Bar {...chartProps} />;
    case 'pie':
      return <Pie {...chartProps} />;
    case 'doughnut':
      return <Doughnut {...chartProps} />;
    default:
      return <Bar {...chartProps} />;
  }
};
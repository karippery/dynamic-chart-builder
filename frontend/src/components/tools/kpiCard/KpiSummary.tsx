import React from 'react';
import {
  People as PeopleIcon,
  DirectionsCar as VehicleIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { KpiSummaryData, BaseKpiCardProps} from '../../../types/kpiCards';
import KpiCardGrid from './KpiCardGrid';

interface KpiSummaryProps {
  data: KpiSummaryData;
  isLoading?: boolean;
}

const KpiSummary: React.FC<KpiSummaryProps> = ({ data, isLoading = false }) => {
  const { totalCount, humanCount, vehicleCount, vestViolationCount } = data;
  const violationRate = totalCount > 0 ? (vestViolationCount / humanCount) * 100 : 0;

  const kpiCards: BaseKpiCardProps[] = [
    {
      title: 'Total Detections',
      value: totalCount,
      icon: <AnalyticsIcon sx={{ fontSize: 32 }} />,
      color: 'primary',
      subtitle: 'All objects detected',
    },
    {
      title: 'Human Count',
      value: humanCount,
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      color: 'info',
      subtitle: 'Human detections',
    },
    {
      title: 'Vehicle Count',
      value: vehicleCount,
      icon: <VehicleIcon sx={{ fontSize: 32 }} />,
      color: 'secondary',
      subtitle: 'Vehicle detections',
    },
    {
      title: 'Vest Violations',
      value: vestViolationCount,
      icon: <SecurityIcon sx={{ fontSize: 32 }} />,
      color: vestViolationCount > 0 ? 'error' : 'success',
      subtitle: `${violationRate.toFixed(1)}% of humans`,
    },
  ];

  return (
    <KpiCardGrid
      cards={kpiCards}
      isLoading={isLoading}
      title="Detection Summary"
    />
  );
};

export default KpiSummary;
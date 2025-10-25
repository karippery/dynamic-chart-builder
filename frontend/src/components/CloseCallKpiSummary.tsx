import React from 'react';
import { Grid } from '@mui/material';
import SumCard from './SumCard';
import { CloseCallKpiData } from '../types/closeCall';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Car,
  AlertCircle,
  Activity
} from 'lucide-react';

interface CloseCallKpiSummaryProps {
  data: CloseCallKpiData | null;
  isLoading?: boolean;
}

// Define valid color types
type ValidColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

const CloseCallKpiSummary: React.FC<CloseCallKpiSummaryProps> = ({ data, isLoading = false }) => {

  const kpiCards = [
    {
      title: 'Total Close Calls',
      value: data?.totalCloseCalls || 0,
      subtitle: 'All severity levels',
      icon: <AlertTriangle size={24} />,
      color: 'primary' as const,
    },
    {
      title: 'High Severity',
      value: data?.highSeverity || 0,
      subtitle: 'Critical incidents',
      icon: <AlertCircle size={24} />,
      color: 'error' as const,
    },
    {
      title: 'Medium Severity',
      value: data?.mediumSeverity || 0,
      subtitle: 'Warning incidents',
      icon: <AlertTriangle size={24} />,
      color: 'warning' as const,
    },
    {
      title: 'Low Severity',
      value: data?.lowSeverity || 0,
      subtitle: 'Minor incidents',
      icon: <Activity size={24} />,
      color: 'info' as const,
    },
    {
      title: 'Human Detections',
      value: data?.humanDetections || 0,
      subtitle: 'Total human observations',
      icon: <Users size={24} />,
      color: 'secondary' as const,
    },
    {
      title: 'Vehicle Detections',
      value: data?.vehicleDetections || 0,
      subtitle: 'Total vehicle observations',
      icon: <Car size={24} />,
      color: 'secondary' as const,
    },
    // {
    //   title: 'Detection Rate',
    //   value: data?.detectionRate || 0,
    //   subtitle: 'Close calls per human detection',
    //   icon: <TrendingUp size={24} />,
    //   color: (data?.detectionRate && data.detectionRate > 5 ? 'error' : 'success') as ValidColor,
    //   formatValue: (val: number) => `${val.toFixed(2)}`,
    // },
  ];

  return (
    <Grid container spacing={2}>
      {kpiCards.map((card, index) => (
        <Grid key={index} size={{ xs: 7, sm: 5, md: 3, lg: 2 }}>
          <SumCard
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            isLoading={isLoading}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default CloseCallKpiSummary;
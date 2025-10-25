import React from 'react';
import { 
  AlertTriangle, 
  Users, 
  Car,
  AlertCircle,
  Activity
} from 'lucide-react'
import KpiCardGrid from './tools/kpiCard/KpiCardGrid';
import { Alert, Box } from '@mui/material';
import CloseCallSummaryCards from './CloseCallSummaryCards';
import { CloseCallKpiData } from '../types/closeCall';


interface CloseCallKpiSummaryProps {
  data: CloseCallKpiData | null;
  isLoading?: boolean;
}

const CloseCallKpiSummary: React.FC<CloseCallKpiSummaryProps> = ({ 
  data, 
  isLoading = false 
}) => {
   if (!data && !isLoading) {
    return (
      <Alert severity="info">
        No KPI data available. Apply filters to see close call statistics.
      </Alert>
    );
  }
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
  ];

  return (
    <Box>
      {/* Compact overview - perfect for limited space */}
      <CloseCallSummaryCards 
        data={data?.close_calls || null}
        isLoading={isLoading}
      />
      
      {/* Detailed breakdown - when users want more info */}
      <KpiCardGrid
        cards={kpiCards}
        isLoading={isLoading}
        title="Close Call Summary"
        gridConfig={{ xs: 12, sm: 6, md: 4, lg: 2 }}
      />
    </Box>
  );
};

export default CloseCallKpiSummary;
import React from 'react';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  People as PeopleIcon,
  DirectionsCar as VehicleIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { KpiSummaryData, KpiCardProps } from '../types/sumcard';
import SumCard from './SumCard';

interface KpiSummaryProps {
  data: KpiSummaryData;
  isLoading?: boolean;
}

const KpiSummary: React.FC<KpiSummaryProps> = ({ data, isLoading = false }) => {
  const { totalCount, humanCount, vehicleCount, vestViolationCount } = data;
  const violationRate =
    totalCount > 0 ? (vestViolationCount / humanCount) * 100 : 0;

  const kpiCards: KpiCardProps[] = [
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
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: 600, mb: 3 }}
      >
      </Typography>

      <Grid container spacing={3}>
        {kpiCards.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
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
    </Box>
  );
};

export default KpiSummary;

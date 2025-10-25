import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { OverspeedEventsResponse, VestViolationsResponse } from '../types/safety';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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
  // Prepare data for violations by zone chart
  const violationsByZoneData = {
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
  };

  // Prepare data for overspeed events by object class
  const overspeedByClassData = {
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
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Loading charts...</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Loading charts...</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Vest Violations by Zone
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={violationsByZoneData} options={chartOptions} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Overspeed Events by Object Class
          </Typography>
          <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={overspeedByClassData} options={chartOptions} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};
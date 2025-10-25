import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  TrendingUp, 
  People, 
  Speed, 
  BarChart,
  DirectionsWalk, // Human
  DirectionsCar,   // Vehicle
  LocalShipping,   // Pallet Truck
  ElectricRickshaw // AGV
} from '@mui/icons-material';

interface AggregateBoxProps {
  value: number | null;
  metric: string;
  bucket: string;
  isLoading?: boolean;
  error?: string | null;
  objectClass?: string; // Add objectClass prop
}

const AggregateBox: React.FC<AggregateBoxProps> = ({
  value,
  metric,
  bucket,
  isLoading = false,
  error = null,
  objectClass,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get icon and label based on metric AND object class
  const getMetricConfig = () => {
    // First, get object class icon if specified
    const objectClassConfig = getObjectClassConfig(objectClass);
    
    // Then get metric configuration
    let metricConfig;
    switch (metric) {
      case 'count':
        metricConfig = { icon: <BarChart />, label: 'Total Events', unit: '' };
        break;
      case 'unique_ids':
        metricConfig = { icon: <People />, label: 'Unique Objects', unit: '' };
        break;
      case 'avg_speed':
        metricConfig = { icon: <Speed />, label: 'Avg Speed', unit: ' m/s' };
        break;
      case 'rate':
        metricConfig = { icon: <TrendingUp />, label: 'Rate', unit: '/hour' };
        break;
      default:
        metricConfig = { icon: <BarChart />, label: 'Metric', unit: '' };
    }

    // Combine object class and metric info
    if (objectClassConfig) {
      return {
        icon: objectClassConfig.icon,
        label: `${objectClassConfig.label} ${metricConfig.label}`,
        unit: metricConfig.unit
      };
    }

    return metricConfig;
  };

  // Get object class specific configuration
  const getObjectClassConfig = (objClass?: string) => {
    if (!objClass) return null;

    switch (objClass.toLowerCase()) {
      case 'human':
        return { 
          icon: <DirectionsWalk />, 
          label: 'Human' 
        };
      case 'vehicle':
        return { 
          icon: <DirectionsCar />, 
          label: 'Vehicle' 
        };
      case 'pallet_truck':
        return { 
          icon: <LocalShipping />, 
          label: 'Pallet Truck' 
        };
      case 'agv':
        return { 
          icon: <ElectricRickshaw />, 
          label: 'AGV' 
        };
      default:
        return null;
    }
  };

  const { icon, label, unit } = getMetricConfig();

  // Format value based on metric
  const formatValue = (val: number | null): string => {
    if (val === null) return '-';
    
    if (metric === 'avg_speed') {
      return `${val.toFixed(2)}${unit}`;
    }
    if (metric === 'rate') {
      return `${val.toFixed(1)}${unit}`;
    }
    return `${val.toLocaleString()}${unit}`;
  };

  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 1 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 3,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 2,
          borderColor: theme.palette.primary.light,
        }
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0,
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          {/* Left side - Icon and Label */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: isMobile ? 'none' : 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? 48 : 56,
                height: isMobile ? 48 : 56,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                color: 'white',
              }}
            >
              {React.cloneElement(icon, { 
                fontSize: isMobile ? 'medium' : 'large' 
              })}
            </Box>
            
            <Box>
              <Typography
                variant={isMobile ? 'body2' : 'body1'}
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ 
                  display: 'block',
                  mt: 0.5,
                  fontSize: isMobile ? '0.7rem' : '0.75rem'
                }}
              >
                Time bucket: {bucket}
                {objectClass && ` • ${objectClass.charAt(0).toUpperCase() + objectClass.slice(1)}`}
              </Typography>
            </Box>
          </Box>

          {/* Right side - Value */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-end',
              flex: isMobile ? 'none' : 1,
              minWidth: isMobile ? '100%' : 'auto',
            }}
          >
            {isLoading ? (
              <CircularProgress size={isMobile ? 32 : 40} />
            ) : (
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="div"
                color="primary.main"
                sx={{
                  fontWeight: 600,
                  fontSize: isMobile ? '1.5rem' : { xs: '1.75rem', md: '2rem' },
                }}
              >
                {formatValue(value)}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AggregateBox;
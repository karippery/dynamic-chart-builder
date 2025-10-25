import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { Warning, Error, Place } from '@mui/icons-material';
import { CloseCallResponse } from '../../types/closeCall';

// Create a partial type that only requires the fields we actually use
interface CloseCallSummaryData {
  total_count?: number;
  by_severity?: {
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
  };
  close_calls?: Array<{
    human_zone?: string;
    vehicle_zone?: string;
  }>;
}

interface CloseCallSummaryCardsProps {
  data: CloseCallSummaryData | CloseCallResponse | null;
  isLoading?: boolean;
}

const CloseCallSummaryCards: React.FC<CloseCallSummaryCardsProps> = ({ 
  data, 
  isLoading = false 
}) => {
  if (!data && !isLoading) {
    return null;
  }

  // Calculate most active zone with safe access
  const getMostActiveZone = () => {
    if (!data?.close_calls || !Array.isArray(data.close_calls)) {
      return { zone: 'N/A', count: 0 };
    }
    
    const zoneCounts: Record<string, number> = {};
    data.close_calls.forEach(call => {
      const zone = call.human_zone || call.vehicle_zone || 'Unknown';
      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });
    
    const mostActiveZone = Object.entries(zoneCounts).reduce((max, [zone, count]) => 
      count > max.count ? { zone, count } : max, 
      { zone: 'N/A', count: 0 }
    );
    
    return mostActiveZone;
  };

  const mostActiveZone = getMostActiveZone();
  
  // Safe access with fallbacks
  const totalCount = data?.total_count || 0;
  const highSeverityCount = data?.by_severity?.HIGH || 0;
  const highSeverityPercentage = totalCount > 0 ? 
    Math.round((highSeverityCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[1, 2, 3].map((item) => (
          <Card key={item} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, bgcolor: 'grey.300', borderRadius: 1 }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ width: '60%', height: 20, bgcolor: 'grey.300', mb: 1 }} />
                <Box sx={{ width: '40%', height: 16, bgcolor: 'grey.300' }} />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ width: 60, height: 24, bgcolor: 'grey.300', mb: 0.5 }} />
                <Box sx={{ width: 40, height: 16, bgcolor: 'grey.300' }} />
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Total Close Calls Card */}
      <Card sx={{ p: 2, '&:hover': { boxShadow: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Warning sx={{ fontSize: 32, color: 'warning.main' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                Total Close Calls
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All incidents detected
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {totalCount}
            </Typography>
            <Typography variant="body1" color="success.main" fontWeight="medium">
              +5%
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* High Severity Card */}
      <Card sx={{ p: 2, '&:hover': { boxShadow: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Error sx={{ fontSize: 32, color: 'error.main' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                High Severity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical risk incidents
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {highSeverityCount}
            </Typography>
            <Typography variant="body1" color="text.primary" fontWeight="medium">
              {highSeverityPercentage}%
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Most Active Zone Card */}
      <Card sx={{ p: 2, '&:hover': { boxShadow: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Place sx={{ fontSize: 32, color: 'info.main' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                Most Active Zone
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Highest incident area
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              Zone {mostActiveZone.zone}
            </Typography>
            <Typography variant="body1" color="text.primary" fontWeight="medium">
              {mostActiveZone.count} calls
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default CloseCallSummaryCards;
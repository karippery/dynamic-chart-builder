import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, Warning, Place, Close } from '@mui/icons-material';

interface CompactStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: string;
  color?: 'primary' | 'error' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  isLoading?: boolean;
  size?: 'small' | 'medium';
}

const CompactStatCard: React.FC<CompactStatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  color = 'primary', 
  icon,
  isLoading = false, 
  size = 'medium'
}) => {
const padding = size === 'small' ? 1 : 2;
const titleVariant = size === 'small' ? 'caption' : 'body2';
const valueVariant = size === 'small' ? 'h6' : 'h5';  
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.startsWith('+')) return <TrendingUp fontSize="small" />;
    if (trend.startsWith('-')) return <TrendingDown fontSize="small" />;
    return null;
  };

  const getDefaultIcon = () => {
    if (icon) return icon;
    if (title.toLowerCase().includes('severity')) return <Warning fontSize="small" />;
    if (title.toLowerCase().includes('zone')) return <Place fontSize="small" />;
    if (title.toLowerCase().includes('total')) return <Close fontSize="small" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card sx={{ flex: 1, minWidth: 120 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={30} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="70%" height={16} sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ flex: 1, minWidth: 120, p: padding }}>
      <CardContent sx={{ p: size === 'small' ? 1 : 2, '&:last-child': { pb: size === 'small' ? 1 : 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: size === 'small' ? 0.5 : 1 }}>
          {getDefaultIcon()}
          <Typography variant={titleVariant} color="text.secondary" sx={{ ml: 0.5 }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant={valueVariant} color={`${color}.main`} sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTrendIcon()}
              <Typography 
                variant="caption" 
                color={trend.startsWith('+') ? 'success.main' : 'error.main'}
                sx={{ ml: 0.25 }}
              >
                {trend}
              </Typography>
            </Box>
          )}
          
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CompactStatCard;
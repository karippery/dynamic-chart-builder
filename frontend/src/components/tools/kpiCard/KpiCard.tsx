import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useTheme,
} from '@mui/material';
import { BaseKpiCardProps, CardColor } from '../../../types/kpiCards';

interface KpiCardProps extends BaseKpiCardProps {
  variant?: 'default' | 'minimal' | 'highlighted';
  showIconBackground?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  isLoading = false,
  formatValue = (val) => val.toLocaleString(),
  variant = 'default',
  showIconBackground = false,
}) => {
  const theme = useTheme();

  const colorMap: Record<CardColor, string> = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  const cardColor = colorMap[color];

  const renderContent = () => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h6"
          component="h3"
          color="text.secondary"
          gutterBottom
          sx={{ fontSize: '0.875rem', fontWeight: 500 }}
        >
          {title}
        </Typography>
        
        {isLoading ? (
          <Skeleton variant="text" width="60%" height={32} />
        ) : (
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 600,
              color: cardColor,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            {formatValue(value)}
          </Typography>
        )}

        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {icon && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: cardColor,
            ml: 2,
            ...(showIconBackground && {
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1.5,
            }),
          }}
        >
          {icon}
        </Box>
      )}
    </Box>
  );

  const getCardStyles = () => {
    const baseStyles = {
      height: '100%',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
      },
    };

    switch (variant) {
      case 'minimal':
        return baseStyles;
      case 'highlighted':
        return {
          ...baseStyles,
          borderLeft: `4px solid ${cardColor}`,
          backgroundColor: theme.palette.background.paper,
        };
      case 'default':
      default:
        return {
          ...baseStyles,
          borderLeft: `4px solid ${cardColor}`,
        };
    }
  };

  return (
    <Card sx={getCardStyles()} elevation={2}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
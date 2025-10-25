import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import KpiCard from './KpiCard';
import { BaseKpiCardProps } from '../../../types/kpiCards';

interface KpiCardGridProps {
  cards: BaseKpiCardProps[];
  isLoading?: boolean;
  title?: string;
  gridConfig?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  cardVariant?: 'default' | 'minimal' | 'highlighted';
  showIconBackground?: boolean;
}

const KpiCardGrid: React.FC<KpiCardGridProps> = ({
  cards,
  isLoading = false,
  title,
  gridConfig = { xs: 12, sm: 6, lg: 3 },
  cardVariant = 'default',
  showIconBackground = false,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {title && (
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontWeight: 600, mb: 3 }}
        >
          {title}
        </Typography>
      )}

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid key={`kpi-card-${index}`} size={gridConfig}>
            <KpiCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              color={card.color}
              isLoading={isLoading}
              formatValue={card.formatValue}
              variant={cardVariant}
              showIconBackground={showIconBackground}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default KpiCardGrid;
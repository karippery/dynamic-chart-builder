
import { AggregationFilters } from '../../types/filters';

export const DEFAULT_FILTERS: AggregationFilters = {
  metric: 'count',
  entity: '',
  group_by: ['time_bucket'],
  time_bucket: '1h',
  object_class: [],
  vest: undefined,
  min_speed: undefined,
  max_speed: undefined,
  min_x: undefined,
  max_x: undefined,
  min_y: undefined,
  max_y: undefined,
  zone: undefined,
  from_time: undefined,
  to_time: undefined,
};
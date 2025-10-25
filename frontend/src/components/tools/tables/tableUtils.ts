// frontend/src/components/tables/tableUtils.ts
export type Order = 'asc' | 'desc';

// Type-safe comparator functions
export function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aValue = a[orderBy];
  const bValue = b[orderBy];
  
  // Handle null/undefined values
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;
  
  // Handle string comparison
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return bValue.localeCompare(aValue);
  }
  
  // Handle number comparison
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return bValue - aValue;
  }
  
  // Fallback for mixed types
  return String(bValue).localeCompare(String(aValue));
}

export function getComparator<T>(
  order: Order,
  orderBy: keyof T,
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
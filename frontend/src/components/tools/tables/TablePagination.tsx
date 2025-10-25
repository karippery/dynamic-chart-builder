
import React from 'react';
import {
  TablePagination as MuiTablePagination,
  TableRow,
  TableFooter,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
}

export const TablePaginationActions: React.FC<TablePaginationActionsProps> = (props) => {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPage /> : <FirstPage />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPage /> : <LastPage />}
      </IconButton>
    </Box>
  );
};

interface TablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  colSpan: number;
  rowsPerPageOptions?: number[];
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  colSpan,
  rowsPerPageOptions = [5, 10, 25, 50],
}) => {
  return (
    <TableFooter>
      <TableRow>
        <MuiTablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          colSpan={colSpan}
          count={count}
          rowsPerPage={rowsPerPage}
          page={page}
          slotProps={{
            select: {
              inputProps: {
                'aria-label': 'rows per page',
              },
              native: true,
            },
          }}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          ActionsComponent={TablePaginationActions}
        />
      </TableRow>
    </TableFooter>
  );
};
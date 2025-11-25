import styled from '@mui/material/styles/styled'
import Table from '@mui/material/Table'

/**
 * @description Oodikone specific styles for Material UI Table
 * To be paired with StyledCell
 */
export const StyledTable = styled(Table, {
  shouldForwardProp: prop => prop !== 'showCellBorders' && prop !== 'zebraStriped',
})<{ showCellBorders?: true; zebraStriped?: true }>(({ theme, showCellBorders, zebraStriped }) => {
  return {
    '&': {
      border: `1px solid ${theme.palette.grey[300]}`,
    },

    '& .MuiTableHead-root': {
      backgroundColor: theme.palette.grey[100],
      border: `1px solid ${theme.palette.grey[300]}`,
      boxShadow: `1px 1px ${theme.palette.grey[300]}`,
    },

    '& .MuiTableCell-root': showCellBorders
      ? {
          border: `1px solid ${theme.palette.grey[300]}`,
        }
      : {},

    '& .MuiTableBody-root>.MuiTableRow-root:hover': {
      backgroundColor: theme.palette.grey[100],
    },

    '& .MuiTableBody-root>.MuiTableRow-root:nth-of-type(even)': zebraStriped
      ? {
          backgroundColor: theme.palette.grey[50],
        }
      : {},
  }
})

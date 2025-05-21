import styled from '@mui/material/styles/styled'
import Table from '@mui/material/Table'

export const StyledTable = styled(Table, {
  shouldForwardProp: prop => prop !== 'showCellBorders',
})<{ showCellBorders?: boolean }>(({ theme, showCellBorders }) => {
  return {
    '& tr': {
      border: `1px solid ${theme.palette.grey[300]}`,
      '&:hover': {
        backgroundColor: theme.palette.grey[50],
      },
    },
    '& th': {
      backgroundColor: theme.palette.grey[50],
    },
    '& th, & td': {
      border: showCellBorders ? `1px solid ${theme.palette.grey[300]}` : 'none',
      padding: theme.spacing(1.5),
    },
  }
})

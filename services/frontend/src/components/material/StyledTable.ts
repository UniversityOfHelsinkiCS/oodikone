import { Table } from '@mui/material'
import { styled } from '@mui/material/styles'

export const StyledTable = styled(Table, {
  shouldForwardProp: prop => prop !== 'showCellBorders',
})<{ showCellBorders?: boolean }>(({ theme, showCellBorders }) => {
  return {
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.shape.borderRadius,
    borderCollapse: 'separate',
    '& tr': {
      border: `1px solid ${theme.palette.grey[300]}`,
      '&:hover': {
        backgroundColor: theme.palette.grey[100],
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

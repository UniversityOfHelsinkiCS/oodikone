import { TableCell, Tooltip, Typography } from '@mui/material'

export const BasicCell = ({ tooltip = null, value }: { tooltip?: JSX.Element | null; value: string | number }) => {
  const cellContent = (
    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
      <Typography color={value.toString().includes('%') ? 'text.secondary' : 'text.primary'} variant="body2">
        {value}
      </Typography>
    </TableCell>
  )

  if (tooltip) {
    return (
      <Tooltip sx={{ cursor: 'pointer' }} title={tooltip}>
        {cellContent}
      </Tooltip>
    )
  }

  return cellContent
}

import { TableCell, Tooltip } from '@mui/material'

export const BasicCell = ({ tooltip = null, value }: { tooltip?: JSX.Element | null; value: string | number }) => {
  if (tooltip) {
    return (
      <Tooltip sx={{ cursor: 'pointer' }} title={tooltip}>
        <TableCell align="right">{value}</TableCell>
      </Tooltip>
    )
  }

  return <TableCell align="right">{value}</TableCell>
}

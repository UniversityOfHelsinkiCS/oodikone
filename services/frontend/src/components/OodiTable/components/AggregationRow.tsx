import TableCell, { type TableCellProps } from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { flexRender } from '@tanstack/react-table'

import type { FC } from 'react'

import { AggregationRow } from '../features/aggregationRows'
import { getCommonPinningStyles } from '../styles'

const OodiTableAggregationCell: FC<TableCellProps> = ({ children, ...props }) => {
  return (
    <TableCell
      {...props}
      sx={{
        borderWidth: '0 1px 1px 0',
        borderStyle: 'solid',
        borderColor: 'grey.300',
        padding: '0 1em',
        height: '3em',
        ...props?.sx,
      }}
    >
      <Typography
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </Typography>
    </TableCell>
  )
}

export const OodiTableAggregationRow = <OTData,>(row: AggregationRow<OTData>) => (
  <TableRow key={row.id}>
    {row.getVisibleCells().map(cell => {
      const { maxSize } = cell.column.columnDef
      return (
        <OodiTableAggregationCell
          key={cell.id}
          sx={{
            ...getCommonPinningStyles(cell.column),
            maxWidth: maxSize !== Number.MAX_SAFE_INTEGER ? maxSize : '20em',
          }}
        >
          {flexRender(cell.column.columnDef.aggregatedCell, cell.getContext())}
        </OodiTableAggregationCell>
      )
    })}
  </TableRow>
)

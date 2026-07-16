import './styles.css'

import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import type { Row, RowData } from '@tanstack/react-table'

import { flexRender } from '@/components/OodiTable/components/util'
import { getCommonPinningStyles } from '@/components/OodiTable/styles'

export const OodiTableDataRow = <OTData extends RowData>(row: Row<OTData>, aggregate = false) => (
  <TableRow key={row.id}>
    {row.getVisibleCells().map(cell => {
      const { size, maxSize } = cell.column.columnDef
      return (
        <TableCell
          className="ot-data-cell"
          key={cell.id}
          sx={{
            ...getCommonPinningStyles(cell.column),
            width: size ?? undefined,
            maxWidth: maxSize !== Number.MAX_SAFE_INTEGER ? maxSize : '20em',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {flexRender(aggregate ? cell.column.columnDef.aggregatedCell : cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      )
    })}
  </TableRow>
)

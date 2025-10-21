import './styles.css'

import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import type { Row } from '@tanstack/react-table'

import { getCommonPinningStyles } from '../styles'
import { flexRender } from './util'

export const OodiTableDataRow = <OTData,>(row: Row<OTData>, aggregate = false) => (
  <TableRow key={row.id}>
    {row.getVisibleCells().map(cell => {
      const { maxSize } = cell.column.columnDef
      return (
        <TableCell
          className="ot-data-cell"
          key={cell.id}
          sx={{
            ...getCommonPinningStyles(cell.column),
            maxWidth: maxSize !== Number.MAX_SAFE_INTEGER ? maxSize : '20em',
          }}
        >
          {flexRender(aggregate ? cell.column.columnDef.aggregatedCell : cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      )
    })}
  </TableRow>
)

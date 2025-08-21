import Box from '@mui/material/Box'
import TableCell, { type TableCellProps } from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { flexRender } from '@tanstack/react-table'
import type { Row } from '@tanstack/react-table'
import type { FC } from 'react'

import { getCommonPinningStyles } from '../styles'

const OodiTableCell: FC<TableCellProps> = ({ children, ...props }) => {
  // console.log(props)

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
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </Box>
    </TableCell>
  )
}

export const OodiTableDataRow = <OTData,>(row: Row<OTData>) => (
  <TableRow key={row.id}>
    {row.getVisibleCells().map(cell => {
      const { maxSize } = cell.column.columnDef
      return (
        <OodiTableCell
          key={cell.id}
          sx={{
            ...getCommonPinningStyles(cell.column),
            maxWidth: maxSize !== Number.MAX_SAFE_INTEGER ? maxSize : '20em',
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </OodiTableCell>
      )
    })}
  </TableRow>
)

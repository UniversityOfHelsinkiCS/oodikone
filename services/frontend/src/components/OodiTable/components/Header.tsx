import TableCell, { type TableCellProps } from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { flexRender } from '@tanstack/react-table'
import type { HeaderGroup } from '@tanstack/react-table'
import type { FC, ReactNode } from 'react'

import { getCommonPinningStyles } from '../styles'
import { OodiTableSortIcons } from './SortIcons'

const OodiTableHeader: FC<TableCellProps & { children?: ReactNode }> = ({ children, ...props }) => {
  return (
    <TableCell
      {...props}
      sx={{
        position: 'relative',
        padding: '1.5em',
        borderWidth: '0 1px 1px 0',
        borderStyle: 'solid',
        borderColor: 'grey.300',
        fontWeight: 'bold',
        backgroundColor: 'white',
        ...props.sx,
      }}
    >
      {children}
    </TableCell>
  )
}

export const OodiTableHeaderGroup = <OTData,>(headerGroup: HeaderGroup<OTData>) => (
  <TableRow key={headerGroup.id}>
    {headerGroup.headers.map(header => {
      if (header.depth - header.column.depth > 1) return null

      let rowSpan = 1
      if (header.isPlaceholder) {
        const leafs = header.getLeafHeaders()
        rowSpan = leafs[leafs.length - 1].depth - header.depth
      }

      return (
        <OodiTableHeader
          colSpan={header.colSpan}
          key={header.id}
          onClick={header.column.getToggleSortingHandler()}
          rowSpan={rowSpan}
          sx={{
            ...getCommonPinningStyles(header.column),
            cursor: header.column.getCanSort() ? 'pointer' : 'inherit',
          }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          <OodiTableSortIcons canSort={header.column.getCanSort()} isSorted={header.column.getIsSorted()} />
        </OodiTableHeader>
      )
    })}
  </TableRow>
)

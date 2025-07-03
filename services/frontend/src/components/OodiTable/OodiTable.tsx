
import Paper from '@mui/material/Paper'
import MuiTable from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import { OodiTableHeader } from './components/Header'
import { OodiTableCell } from './components/Cell'

import { flexRender, Table as TableType } from '@tanstack/react-table'

export const OodiTableContainer = <OTData,>({ table }: { table: TableType<OTData> }) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ p: 2, border: '1px solid #d4d4d5', borderRadius: 0 }}>
      <MuiTable>
        <TableHead>
          {table.getHeaderGroups().map(headerGroup => {
            return (
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
                      key={header.id}
                      colSpan={header.colSpan}
                      rowSpan={rowSpan}
                      onClick={header.column.getToggleSortingHandler()}
                      sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'inherit' }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: <ArrowUpwardIcon fontSize='small' />,
                        desc: <ArrowDownwardIcon fontSize='small' />,
                        false: " "
                      }[header.column.getIsSorted() as string] ?? null}
                    </OodiTableHeader>
                  )
                }
                )}
              </TableRow>
            )
          })}
        </TableHead>
        <TableBody sx={{
          '& tr:nth-of-type(odd) > td': {
            backgroundColor: 'grey.100'
          }
        }}>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <OodiTableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </OodiTableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  )
}

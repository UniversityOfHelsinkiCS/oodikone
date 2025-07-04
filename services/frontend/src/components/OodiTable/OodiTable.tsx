import Paper from '@mui/material/Paper'
import MuiTable from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { Box } from '@mui/material'

import { OodiTableHeader } from './components/Header'
import { OodiTableCell } from './components/Cell'

import { flexRender, type Table as TableType } from '@tanstack/react-table'
import { getCommonPinningStyles } from './styles'

export const OodiTableContainer = <OTData,>({ table }: { table: TableType<OTData> }) => {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        height: '75vh',
        overflow: 'scroll',
        p: 0,
        borderWidth: '1px 0 0 1px',
        borderStyle: 'solid',
        borderColor: 'grey.300',
        borderRadius: 0,
      }}
    >
      <MuiTable
        sx={{
          borderCollapse: 'separate', // Prevents items clipping through borders when scrolling
        }}>
        <TableHead
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
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
                      sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'inherit', ...getCommonPinningStyles(header.column) }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <Box
                        sx={{
                          position: 'absolute',
                          right: -2,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'flex-end',
                          height: 'fit-content',
                          width: 'fit-content',
                        }}>
                        {{
                          asc: <ArrowUpwardIcon fontSize='small' />,
                          desc: <ArrowDownwardIcon fontSize='small' />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </Box>
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
          },
          '& tr:nth-of-type(even) > td': {
            backgroundColor: 'white'
          },
        }}>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <OodiTableCell
                  key={cell.id}
                  sx={{ ...getCommonPinningStyles(cell.column) }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </OodiTableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer >
  )
}

import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'

import { type Table as TableType } from '@tanstack/react-table'
import { OodiTableDataRow } from './components/Cell'
import { OodiTableHeaderGroup } from './components/Header'
import { OodiTablePagination } from './components/Pagination'

export const OodiTableContainer = <OTData,>({
  table,
  isExportView,
}: {
  table: TableType<OTData>
  isExportView?: true
}) => {
  const verticalHeaders = table.getState().useVerticalHeaders ?? []

  return (
    <Paper sx={{ p: 2, borderRadius: 0 }} variant="outlined">
      <TableContainer
        sx={{
          maxHeight: '75vh',
          height: 'auto',
          overflowY: 'scroll',
          overflowX: isExportView ? 'hidden' : 'scroll',
          p: 0,
          borderWidth: '1px 0 0 1px',
          borderStyle: 'solid',
          borderColor: 'grey.300',
        }}
      >
        <Table
          sx={{
            borderCollapse: 'separate', // Prevents items clipping through borders when scrolling
          }}
        >
          <TableHead
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
            }}
          >
            {table.getHeaderGroups().map(group => OodiTableHeaderGroup(group, verticalHeaders))}
          </TableHead>
          <TableBody
            sx={{
              '& tr:nth-of-type(odd) > td': {
                backgroundColor: 'grey.100',
              },
              '& tr:nth-of-type(even) > td': {
                backgroundColor: 'white',
              },
            }}
          >
            {table.getAggregationRowModel().rows.map(row => OodiTableDataRow(row, true))}
            {table.getRowModel().rows.map(row => OodiTableDataRow(row))}
          </TableBody>
        </Table>
      </TableContainer>
      <OodiTablePagination table={table} />
    </Paper>
  )
}

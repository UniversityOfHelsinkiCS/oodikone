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
  cy,
}: {
  table: TableType<OTData>
  isExportView?: true
  cy?: string
}) => {
  const verticalHeaders = table.getState().useVerticalHeaders ?? []
  const zebraStriped = table.getState().useZebrastripes

  return (
    <Paper data-cy={cy} sx={{ p: 2, borderRadius: 0 }} variant="outlined">
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
              '& tr > td': {
                backgroundColor: 'white',
              },

              '& tr:nth-of-type(odd) > td': zebraStriped
                ? {
                    backgroundColor: 'grey.100',
                  }
                : {},
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

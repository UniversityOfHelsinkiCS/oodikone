import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'

import { type Table as TableType } from '@tanstack/react-table'
import { ReactNode } from 'react'
import { OodiTableDataRow } from './components/Cell'
import { OodiTableHeaderGroup } from './components/Header'
import { OodiTablePagination } from './components/Pagination'

export const OodiTableContainer = <OTData,>({
  table,
  toolbarContent,
  isExportView,
  cy,
}: {
  table: TableType<OTData>
  toolbarContent?: ReactNode
  isExportView?: true
  cy?: string
}) => {
  const verticalHeaders = table.getState().useVerticalHeaders ?? []
  const zebraStriped = table.getState().useZebrastripes

  return (
    <Paper data-cy={cy} sx={{ my: 2, borderRadius: 0 }} variant="outlined">
      {!!toolbarContent && (
        <Stack direction="row" spacing={3} sx={{ p: 2, justifyContent: 'flex-start' }}>
          {toolbarContent}
        </Stack>
      )}
      <TableContainer
        sx={{
          borderWidth: '1px 0 1px 0',
          borderStyle: 'solid',
          borderColor: 'grey.300',
          maxHeight: '75vh',
          overflowY: 'scroll',
          overflowX: isExportView ? 'hidden' : 'scroll',
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

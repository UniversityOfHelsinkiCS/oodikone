import TablePagination from '@mui/material/TablePagination'
import type { Table } from '@tanstack/react-table'

export const OodiTablePagination = <TData,>({ table }: { table: Table<TData> }) => (
  <TablePagination
    component="div"
    count={table.getFilteredRowModel().rows.length}
    onPageChange={(_, newPage) => table.setPageIndex(newPage)}
    onRowsPerPageChange={event => {
      table.setPageSize(Number(event.target.value))
      table.setPageIndex(0)
    }}
    page={table.getState().pagination.pageIndex}
    rowsPerPage={table.getState().pagination.pageSize}
    rowsPerPageOptions={[100, 200, 500, 1000, table.getRowCount()]}
  />
)

import type { Table } from '@tanstack/react-table'
import TablePagination from '@mui/material/TablePagination'

export const OodiTablePagination = <TData,>({ table }: { table: Table<TData> }) => (
  <TablePagination
    component="div"
    page={table.getState().pagination.pageIndex}
    rowsPerPage={table.getState().pagination.pageSize}
    onPageChange={(_, newPage) => table.setPageIndex(newPage)}
    count={table.getFilteredRowModel().rows.length}
    rowsPerPageOptions={[25, 50, 100, 200]}
    onRowsPerPageChange={event => {
      table.setPageSize(Number(event.target.value))
      table.setPageIndex(0)
    }}
  />
)

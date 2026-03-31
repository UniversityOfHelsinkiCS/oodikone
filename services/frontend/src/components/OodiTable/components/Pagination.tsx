import TablePagination from '@mui/material/TablePagination'
import type { Table } from '@tanstack/react-table'
import { useEffect, useState } from 'react'

export const OodiTablePagination = <TData,>({ table }: { table: Table<TData> }) => {
  const tableRows = table.getRowCount()
  const pageRowOptions = [100, 200, 500, 1000, tableRows].filter(count => count <= tableRows)

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: Math.min(200, tableRows),
  })

  useEffect(() => table.setPageSize(pagination.pageSize), [pagination.pageSize])
  useEffect(() => table.setPageIndex(pagination.pageIndex), [pagination.pageIndex])

  useEffect(
    () =>
      setPagination({
        pageIndex: 0,
        pageSize: Math.max(pagination.pageSize, pageRowOptions[0]),
      }),
    [table.getCoreRowModel().rows.length]
  )

  return (
    <TablePagination
      component="div"
      count={table.getFilteredRowModel().rows.length}
      onPageChange={(_, newPage) => setPagination({ ...pagination, pageIndex: newPage })}
      onRowsPerPageChange={event => setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}
      page={table.getState().pagination.pageIndex}
      rowsPerPage={table.getState().pagination.pageSize}
      rowsPerPageOptions={pageRowOptions}
    />
  )
}

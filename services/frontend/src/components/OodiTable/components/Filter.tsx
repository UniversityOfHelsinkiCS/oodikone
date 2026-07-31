import { TableCell } from "@mui/material"
import TableRow from "@mui/material/TableRow"
import type { Table } from "@tanstack/react-table"

export const OodiTableFilters = <TData,>(table: Table<TData>) => {
  if (!table.options.enableFilters) return null

  return (
    <TableRow>
      {
        // NOTE: getVisibleLeafColumns is used as they should be the only ones with filtering capabilities
        table.getVisibleLeafColumns().map(column => (
          <TableCell key={column.id}>
            { column.getCanFilter() && column.columnDef.meta?.filterComponent?.() }
          </TableCell>
        ))
      }
    </TableRow>
  )
}

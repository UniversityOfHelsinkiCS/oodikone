// 03-06-2025 summer hackathon never forget

import { useReactTable, getCoreRowModel, ColumnDef, TableOptions, getPaginationRowModel } from '@tanstack/react-table'
import { OodiTableContainer } from './OodiTable'

/**
 * In loving memory of SortableTable
 *
 * @param data - Array of data objects of type OTData
 * @param columns - Array of column definitions for type OTData
 * @param options - Optional: Additional TableOptions
 * @returns Table instance
 */

// eslint-disable-next-line
export const OodiTable = <OTData,>({ data,
  columns,
  options,
}: { data: OTData[], columns: ColumnDef<OTData, any>[], options?: Partial<TableOptions<OTData>> }): JSX.Element => {

  // const baseOptions:

  const table = useReactTable<OTData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: 0,
        pageSize: Math.min(30, data.length),
      }
    },
    ...options,
  })
  return <OodiTableContainer table={table} />
}

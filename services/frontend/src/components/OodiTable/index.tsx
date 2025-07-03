// 03-06-2025 summer hackathon never forget

import { useReactTable, getCoreRowModel, ColumnDef, TableOptions, getPaginationRowModel } from '@tanstack/react-table'
import { OodiTableContainer } from './OodiTable'

/**
 * In loving memory of SortableTable
 *
 * Documentation in ./README.md
 *
 * @param data - Array of data objects of type TData
 * @param columns - Array of column definitions for type TData
 * @param options - Optional: Additional TableOptions
 * @returns Table instance
 */

// eslint-disable-next-line
export const OodiTable = <TData,>({ data,
  columns,
  options,
}: { data: TData[], columns: ColumnDef<TData, any>[], options?: Partial<TableOptions<TData>> }): JSX.Element => {

  // const baseOptions:

  const table = useReactTable<TData>({
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

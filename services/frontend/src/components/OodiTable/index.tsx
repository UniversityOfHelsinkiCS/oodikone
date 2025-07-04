// 03-06-2025 summer hackathon never forget

import { useReactTable, getCoreRowModel, ColumnDef, TableOptions, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
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

  // should maybe use a deep merging tool or write own
  const config: Partial<TableOptions<TData>> = {
    ...options,
    state: {
      ...options?.state,
      pagination: {
        pageIndex: 0,
        pageSize: 100,
        ...options?.state?.pagination,
      },
    },
  }
  console.log(config)

  const table = useReactTable<TData>({
    data,
    columns,
    // TODO: remove debug when done
    debugTable: true,
    debugHeaders:true,
    debugColumns: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...config,
  })
  return <OodiTableContainer table={table} />
}

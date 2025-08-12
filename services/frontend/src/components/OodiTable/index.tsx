// 03-07-2025 summer hackathon never forget

import type { ColumnDef, TableOptions } from '@tanstack/react-table'
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
import { useState } from 'react'

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

export const OodiTable = <TData,>({
  data,
  columns,
  options = {},
}: {
  data: TData[]
  columns: ColumnDef<TData>[]
  options?: Partial<TableOptions<TData>>
}) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 200,
  })

  // should maybe use a deep merging tool or write own
  const config: Partial<TableOptions<TData>> = {
    ...options,
  }

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    ...config,
    state: { pagination, ...config.state },
  })
  return <OodiTableContainer table={table} />
}

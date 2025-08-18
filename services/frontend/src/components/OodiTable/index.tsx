// 03-07-2025 summer hackathon never forget

import type { ColumnDef, TableFeature, TableOptions } from '@tanstack/react-table'
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
import { useState } from 'react'

import { OodiTableContainer } from './OodiTable'

interface VerticalHeaders {
  useVerticalHeaders: string[]
}

const VerticalHeaderFeature: TableFeature<unknown> = {
  getInitialState: (state): VerticalHeaders => {
    return {
      useVerticalHeaders: [],
      ...state,
    }
  },
}

declare module '@tanstack/react-table' {
  interface TableState extends VerticalHeaders {}
}


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
    pageSize: Math.min(200, data.length),
  })

  // should maybe use a deep merging tool or write own
  const config: Partial<TableOptions<TData>> = {
    ...options,
  }

  const table = useReactTable<TData>({
    _features: [VerticalHeaderFeature],
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

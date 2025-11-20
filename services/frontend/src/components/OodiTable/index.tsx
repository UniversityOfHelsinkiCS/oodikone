import type { ColumnDef, TableOptions } from '@tanstack/react-table'
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
import { useState } from 'react'

import { AggregationRowFeature, VerticalHeaderFeature, ZebrastripesFeature } from './features'
import { OodiTableContainer } from './OodiTable'

/**
 * In loving memory of SortableTable
 *
 * Documentation in ./README.md
 *
 * @param data - Array of data objects of type TData
 * @param columns - Array of column definitions for type TData
 * @param isExportView (default false) Is table used in an export modal to provide preview
 * @param options - Optional: Additional TableOptions
 * @param cy - Optional: data-cy tag provided to the wrapper around the TableContainer
 * @returns Table instance
 */

export const OodiTable = <TData,>({
  data,
  columns,
  isExportView,
  options = {},
  cy,
}: {
  data: TData[]
  columns: ColumnDef<TData>[]
  isExportView?: true
  options?: Partial<TableOptions<TData>>
  cy?: string
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
    _features: [VerticalHeaderFeature, AggregationRowFeature, ZebrastripesFeature],
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    ...config,
    state: { pagination, ...config.state },
  })
  return <OodiTableContainer cy={cy} isExportView={isExportView} table={table} />
}

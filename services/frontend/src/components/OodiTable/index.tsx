import type { ColumnDef, RowData, Table, TableOptions } from '@tanstack/react-table'
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
import { useState, type ReactNode } from 'react'

import { AggregationRowFeature, VerticalHeaderFeature, ZebrastripesFeature } from '@/components/OodiTable/features'
import { OodiTableContainer } from '@/components/OodiTable/OodiTable'

/**
 * In loving memory of SortableTable
 *
 * Documentation in ./README.md
 *
 * @param data - Array of data objects of type TData
 * @param columns - Array of column definitions for type TData
 * @param isExportView (default false) Is table used in an export modal to provide preview
 * @param toolbarContent - Shown above the table
 * @param options - Optional: Additional TableOptions
 * @param cy - Optional: data-cy tag provided to the wrapper around the TableContainer
 * @returns Table instance
 */

export const OodiTable = <TData extends RowData>({
  data,
  columns,
  isExportView,
  toolbarContent,
  options = {},
  cy,
}: {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  isExportView?: true
  options?: Partial<TableOptions<TData>>
  toolbarContent?: ReactNode
  cy?: string
}) => {
  const [fallbackData] = useState()

  const table: Table<TData> = useReactTable<TData>(
    Object.assign<TableOptions<TData>, Partial<TableOptions<TData>>>(
      {
        _features: [VerticalHeaderFeature, AggregationRowFeature, ZebrastripesFeature],
        data: data ?? fallbackData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
      },
      options
    )
  )
  return <OodiTableContainer cy={cy} isExportView={isExportView} table={table} toolbarContent={toolbarContent} />
}

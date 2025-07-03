// 03-06-2025 summer hackathon never forget

import { useReactTable, getCoreRowModel, ColumnDef, TableOptions } from '@tanstack/react-table'
import { OodiTable } from './OodiTable'

/**
 * In loving memory of SortableTable
 *
 * @param data - Array of data objects of type OTData
 * @param columns - Array of column definitions for type OTData
 * @param options - Optional: Additional TableOptions
 * @returns Table instance
 */

// eslint-disable-next-line
export const useOodiTable = <OTData,>(
  data: OTData[],
  columns: ColumnDef<OTData, any>[],
  options?: Partial<TableOptions<OTData>>
): JSX.Element => {
  const table = useReactTable<OTData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...options,
  })
  return <OodiTable table={table} />
}

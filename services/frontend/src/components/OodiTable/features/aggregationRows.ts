import { Cell, CellContext, Column, Row, Table, TableFeature } from '@tanstack/react-table'

/**
 * This doesn't implement all the features of Row, so be aware of that
 */
export interface AggregationRow<TData> extends Row<TData> {
  getIsAggregationRow: () => true
}

type AggregationRowValueFn<TData, TValue = unknown> = (ctx: {
  table: Table<TData>
  rowId: string
  column: Column<TData, TValue>
}) => TValue

interface AggregationRowCellDef<TData, TValue = unknown> {
  id: string
  value: TValue | AggregationRowValueFn<TData, TValue>
}

export type AggregationRowsInput<TData, TValue = unknown> =
  | AggregationRowCellDef<TData, TValue>[]
  | ((ctx: { table: Table<TData>; column: Column<TData> }) => AggregationRowCellDef<TData, TValue>[])

export interface AggregationRowModel<TData> {
  rows: AggregationRow<TData>[]
  flatRows: AggregationRow<TData>[]
  rowsById: Record<string, AggregationRow<TData>>
}

const resolveAggregationRowsArray = <TData, TValue>(
  table: Table<TData>,
  column: Column<TData, TValue>
): AggregationRowCellDef<TData, TValue>[] => {
  const input = column.columnDef.aggregationRows
  if (!input) return []
  return typeof input === 'function' ? (input({ table, column }) ?? []) : input
}

const collectAggregationRowIds = <TData>(table: Table<TData>): string[] => {
  const seen: string[] = []
  const set = new Set<string>()

  table.getAllLeafColumns().forEach(col => {
    const defs = resolveAggregationRowsArray(table, col)
    if (!defs) return
    for (const def of defs) {
      if (!set.has(def.id)) {
        set.add(def.id)
        seen.push(def.id)
      }
    }
  })
  return seen
}

const resolveAggregationCellValue = <TData, TValue>(
  table: Table<TData>,
  column: Column<TData, unknown>,
  aggRowId: string
): TValue | undefined => {
  const defs = resolveAggregationRowsArray(table, column)
  const def = defs.find(def => def.id === aggRowId)
  if (!def) return undefined
  const { value } = def
  if (typeof value === 'function') {
    return (value as AggregationRowValueFn<TData>)({
      table,
      rowId: aggRowId,
      column,
    }) as TValue
  }
  return value as TValue
}

const buildAggregationRowModel = <TData>(table: Table<TData>): AggregationRowModel<TData> => {
  const aggRowIds = collectAggregationRowIds(table)

  if (!aggRowIds.length) {
    return {
      rows: [],
      flatRows: [],
      rowsById: {},
    } as unknown as AggregationRowModel<TData>
  }

  const visibleLeafColumns =
    table.getVisibleLeafColumns?.() ?? table.getAllLeafColumns().filter((col: any) => col.getIsVisible?.() ?? true)

  const rowsById: Record<string, AggregationRow<TData>> = {}
  const rows: AggregationRow<TData>[] = []
  const flatRows: AggregationRow<TData>[] = []

  aggRowIds.forEach((aggRowId, index) => {
    const row: AggregationRow<TData> = {
      id: aggRowId,
      index,
      depth: 0,
      original: undefined as any,
      parentId: undefined,
      _valuesCache: {},
      _uniqueValuesCache: {},
      _groupingValuesCache: {},
      getValue: <TValue>(columnId: string): TValue => {
        const column = table.getColumn(columnId)
        return column
          ? (resolveAggregationCellValue<TData, TValue>(table, column, aggRowId) as TValue)
          : (undefined as TValue)
      },

      getVisibleCells: () => {
        if (!(row as any)._cells) {
          ;(row as any)._cells = visibleLeafColumns.map(column => {
            const cell: Cell<TData, unknown> = {
              id: `${column.id}_${row.id}`,
              row,
              column,
              getValue: () => row.getValue(column.id),
              getContext: () =>
                ({
                  table,
                  column,
                  row,
                  cell,
                  getValue: cell.getValue,
                  renderValue: cell.getValue(),
                }) as CellContext<TData, unknown>,
              renderValue: () => cell.getValue(),
            } as Cell<TData, unknown>
            return cell
          })
        }
        return (row as any)._cells as Cell<TData, unknown>[]
      },

      /** Unimplemented and redundant, use getVisibleCells instead */
      getAllCells: () => undefined,
      getLeafRows: () => [row],
      getParentRow: () => undefined,
      subRows: [],
      getIsAggregationRow: () => true,
    } as unknown as AggregationRow<TData>

    rows.push(row)
    flatRows.push(row)
    rowsById[row.id] = row
  })

  return { rows, flatRows, rowsById }
}

export const AggregationRowFeature: TableFeature<any> = {
  createTable: <TData>(table: Table<TData>) => {
    table.getAllAggregationRowIds = () => collectAggregationRowIds(table)

    table.hasAggregationRows = () => collectAggregationRowIds(table).length > 0

    table.getAggregationRowModel = () => buildAggregationRowModel(table)
  },
}

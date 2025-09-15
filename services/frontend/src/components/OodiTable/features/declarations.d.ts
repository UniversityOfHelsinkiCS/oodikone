/* eslint-disable import-x/no-unused-modules */
export {}

import '@tanstack/react-table'

import { AggregationRowModel, AggregationRowsInput } from './aggregationRows'
import { VerticalHeaders } from './verticalHeader'

declare module '@tanstack/react-table' {
  interface TableState extends VerticalHeaders {}

  interface ColumnDefBase<TData, TValue = unknown> {
    /**
     * Accepts two kinds of inputs:
     *
     * 1. An array directly `{ id: String, value: T }[]`
     * 2. A function `({ table, column }) => {id: String, value:T}[]`
     *
     * `id` is used for grouping
     *
     * Use same `id` on multiple rows to supply data to the same aggregation row,
     * or different `id` to create multiple rows.
     *
     * Order matters and is based on the first occurence of id.
     */
    aggregationRows?: AggregationRowsInput<TData, TValue>
  }

  interface Table<TData> {
    getAggregationRowModel: () => AggregationRowModel<TData>
    getAllAggregationRowIds: () => string[]
    hasAggregationRows: () => boolean
  }

  interface Row {
    getIsAggregationRow?: () => boolean
  }
}

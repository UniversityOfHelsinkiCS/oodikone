import _ from 'lodash'

import { getColumnValue, getRowOptions } from '@/components/SortableTable/common'
import { DataVisitor } from './DataVisitor'

export class SortingFilteringVisitor extends DataVisitor {
  constructor(columns, state, filterTypes) {
    super()
    this.columns = columns
    this.state = state
    this.filterTypes = filterTypes
    this.sentinel = Symbol('FILTERED')
  }

  createRowSortingFunction(pCtx) {
    const sortByColumn = Object.entries(this.state.columnOptions).find(([, options]) => options.sort)

    if (!sortByColumn) {
      return undefined
    }

    const [columnKey, { sort: orderDirection }] = sortByColumn
    const column = this.columns[columnKey]

    return (a, b) => {
      let va = getColumnValue(pCtx.withItem(a), column)
      let vb = getColumnValue(pCtx.withItem(b), column)

      if (getRowOptions(a).ignoreSorting) return -1
      if (getRowOptions(b).ignoreSorting) return 1

      if (va == null) return 1
      if (vb == null) return -1

      if (typeof va !== typeof vb) {
        va = va.toString()
        vb = vb.toString()
      }

      let comparison = 0

      switch (typeof va) {
        case 'string':
          comparison = va.localeCompare(vb, 'fi', { sensitivity: 'accent' })
          break
        case 'number':
          comparison = va - vb
          break
        case 'object':
          if (va instanceof Date) comparison = va.getTime() - vb.getTime()
          break
        default:
          break
      }

      return orderDirection === 'asc' ? comparison : comparison * -1
    }
  }

  visitRow(ctx) {
    if (getRowOptions(ctx.item).ignoreFilters) return ctx.item

    const passes = _.chain(this.state.columnOptions)
      .toPairs()
      .filter(([, options]) => options.filterOptions !== undefined)
      .map(([column, { filterOptions }]) => {
        const { filter } = this.filterTypes[this.columns[column].filterType ?? 'default']
        return filter(ctx, this.columns[column], filterOptions)
      })
      .every()
      .value()

    if (!passes) {
      return this.sentinel
    }

    return ctx.item
  }

  visitItems(pItems, pCtx) {
    const items = super.visitItems(pItems, pCtx)
    const func = this.createRowSortingFunction(pCtx)

    return items.filter(i => i !== this.sentinel).sort(func)
  }
}

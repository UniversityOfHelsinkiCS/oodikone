/* eslint-disable @babel/no-invalid-this */
import _ from 'lodash'
import { DataVisitor } from './DataVisitor'
import { getColumnValue, getRowOptions } from '../common'

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

    const [columnKey, { sort }] = sortByColumn
    const column = this.columns[columnKey]

    if (sort === 'desc') {
      return (a, b) => {
        let va = getColumnValue(pCtx.withItem(a), column)
        let vb = getColumnValue(pCtx.withItem(b), column)

        if (getRowOptions(a).ignoreSorting) return -1
        if (getRowOptions(b).ignoreSorting) return 1

        if (typeof va === 'string' && typeof vb === 'string') {
          va = va.toLowerCase()
          vb = vb.toLowerCase()
        }
        if (va === 'Not saved') {
          return 0
        }

        if (va !== 'Not saved' && vb === 'Not saved') {
          return -1
        }

        if (va === vb) {
          return 0
        }
        if (va < vb) {
          return 1
        }
        return -1
      }
    }

    return (a, b) => {
      let va = getColumnValue(pCtx.withItem(a), column)
      let vb = getColumnValue(pCtx.withItem(b), column)

      if (getRowOptions(a).ignoreSorting) return -1
      if (getRowOptions(b).ignoreSorting) return 1

      if (typeof va === 'string' && typeof vb === 'string') {
        va = va.toLowerCase()
        vb = vb.toLowerCase()
      }

      if (va === vb) {
        return 0
      }
      if (va < vb) {
        return -1
      }
      return 1
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

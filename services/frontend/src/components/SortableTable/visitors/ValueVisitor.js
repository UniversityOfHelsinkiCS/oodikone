import { flatten, fromPairs, isArray, map, mapValues, sampleSize, uniq } from 'lodash'

import { getColumnValue, getRowOptions } from '@/components/SortableTable/common'
import { DataVisitor } from './DataVisitor'

export class ValueVisitor extends DataVisitor {
  constructor(columns, options = {}) {
    super()
    this.columns = columns
    this.exportMode = options?.exportMode
    this.honourIgnoreFilters = options?.honourIgnoreFilters
    this.values = fromPairs(map(columns, column => [column.key, new Set()]))
  }

  visitRow(ctx) {
    if (this.honourIgnoreFilters && getRowOptions(ctx.item).ignoreFilters) {
      return
    }

    this.columns.forEach(column => {
      const value = getColumnValue(ctx, column, this.exportMode)
      this.values[column.key].add(value)
    })
  }

  sample(n) {
    return mapValues(this.values, v => {
      let array = [...v.values()]

      if (array.some(child => isArray(child))) {
        array = uniq(flatten(array))
      }

      return sampleSize(array, n)
    })
  }
}

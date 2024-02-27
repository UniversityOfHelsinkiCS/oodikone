import _ from 'lodash'

import { getColumnValue, getRowOptions } from '../common'
import { DataVisitor } from './DataVisitor'

export class ValueVisitor extends DataVisitor {
  constructor(columns, options = {}) {
    super()
    this.columns = columns
    this.exportMode = options?.exportMode
    this.honourIgnoreFilters = options?.honourIgnoreFilters
    this.values = _.fromPairs(_.map(columns, c => [c.key, new Set()]))
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
    return _.mapValues(this.values, v => {
      let array = [...v.values()]

      if (array.some(child => _.isArray(child))) {
        array = _.uniq(_.flatten(array))
      }

      return _.sampleSize(array, n)
    })
  }
}

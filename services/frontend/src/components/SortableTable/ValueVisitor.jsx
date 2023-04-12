/* eslint-disable babel/no-invalid-this */
import _ from 'lodash'
import DataVisitor from './DataVisitor'
import { getColumnValue, getRowOptions } from './common'

export default class ValueVisitor extends DataVisitor {
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
    return _.chain(this.values)
      .mapValues(v => _.sampleSize([...v], n))
      .value()
  }
}

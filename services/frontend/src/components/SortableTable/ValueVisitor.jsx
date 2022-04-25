import _ from 'lodash'
import DataVisitor from './DataVisitor'
import { getColumnValue } from './common'

export default class ValueVisitor extends DataVisitor {
  constructor(columns, exportMode = false) {
    super()
    this.columns = columns
    this.exportMode = exportMode
    this.values = _.fromPairs(_.map(columns, c => [c.key, new Set()]))
  }

  visitRow(ctx) {
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

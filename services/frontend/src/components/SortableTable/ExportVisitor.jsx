import _ from 'lodash'
import DataVisitor from './DataVisitor'
import { getColumnTitle, getColumnValue } from './common'

export default class ExportVisitor extends DataVisitor {
  constructor(columns) {
    super()
    this.columns = columns
    this.rows = []
  }

  visitRow(ctx) {
    const row = _.chain(this.columns)
      .map(column => [getColumnTitle(column), getColumnValue(ctx, column, true)])
      .fromPairs()
      .value()

    this.rows.push(row)
  }
}

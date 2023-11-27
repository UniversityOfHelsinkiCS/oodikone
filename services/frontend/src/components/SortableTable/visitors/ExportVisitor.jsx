import _ from 'lodash'

import { DataVisitor } from './DataVisitor'
import { getColumnTitle, getColumnValue } from '../common'

export class ExportVisitor extends DataVisitor {
  constructor(columns) {
    super()
    this.columns = columns
    this.rows = []
  }

  visitRow(ctx) {
    const row = _.chain(this.columns)
      .map(column => [getColumnTitle(column).replaceAll('\n', ' '), getColumnValue(ctx, column, true)])
      .fromPairs()
      .value()

    this.rows.push(row)
  }
}

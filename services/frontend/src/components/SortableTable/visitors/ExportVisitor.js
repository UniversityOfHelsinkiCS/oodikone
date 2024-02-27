import _ from 'lodash'

import { getColumnTitle, getColumnValue } from '../common'
import { DataVisitor } from './DataVisitor'

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

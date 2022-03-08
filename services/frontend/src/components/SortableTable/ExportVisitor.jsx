import _ from 'lodash'
import DataVisitor from './DataVisitor'
import { getColumnValue } from './common'

const getColumnTitle = column => {
  return [...(column.parents ?? []), column]
    .filter(c => c.title)
    .map(c => c.title)
    .join(' - ')
}

export default class ExportVisitor extends DataVisitor {
  constructor(columns) {
    super()
    this.columns = columns
    this.rows = []
  }

  visitRow(ctx) {
    const row = _.chain(this.columns)
      .map(column => [getColumnTitle(column), getColumnValue(ctx, column)])
      .fromPairs()
      .value()

    this.rows.push(row)
  }
}

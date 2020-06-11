import React from 'react'
import { Table } from 'semantic-ui-react'
import { string, bool, func, number } from 'prop-types'

const SortableHeaderCell = ({ content, columnName, onClickFn, activeSortColumn, reversed, rowSpan }) => {
  const isTableSortedBy = activeSortColumn === columnName
  const direction = reversed ? 'ascending' : 'descending'

  return (
    <Table.HeaderCell
      rowSpan={`${rowSpan}`}
      sorted={isTableSortedBy ? direction : null}
      onClick={() => onClickFn(columnName)}
      className={isTableSortedBy ? 'activeSortHeader' : 'activeSortHeader'}
      content={content}
    />
  )
}

SortableHeaderCell.propTypes = {
  content: string.isRequired,
  columnName: string.isRequired,
  activeSortColumn: string.isRequired,
  reversed: bool.isRequired,
  onClickFn: func.isRequired,
  rowSpan: number
}

SortableHeaderCell.defaultProps = {
  rowSpan: 1
}

export default SortableHeaderCell

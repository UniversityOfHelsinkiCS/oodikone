import React from 'react'
import { Table } from 'semantic-ui-react'
import { arrayOf, array, string, func, bool } from 'prop-types'

import './searchResultsTable.css'

const getHeaderRow = headers => (
  <Table.Header>
    <Table.Row>
      {
        headers.map(header => (
          <Table.HeaderCell key={`header-${header}`}>
            {header}
          </Table.HeaderCell>
        ))
      }
    </Table.Row>
  </Table.Header>
)

const getTableBody = (rows, rowClickFn, selectable) => (
  <Table.Body>
    {
      rows.map((row, i) => (
        <Table.Row
          className={(selectable ? 'selectableRow' : '')}
          key={`row-${i}`} // eslint-disable-line react/no-array-index-key
          onClick={e => rowClickFn(e, row)}
        >
          {
            Object.values(row).map((value, index) => (
              <Table.Cell key={`cell-${index}`}>{value}</Table.Cell>)) // eslint-disable-line react/no-array-index-key
          }
        </Table.Row>
      ))
    }
  </Table.Body>
)

const SearchResultTable = ({
  headers, rows, rowClickFn, noResultText, selectable, definition
}) => {
  if (rows.length > 0) {
    return (
      <Table
        unstackable
        selectable={selectable}
        definition={definition}
        className="fixed-header"
      >
        {getHeaderRow(headers)}
        {getTableBody(rows, rowClickFn, selectable)}
      </Table>)
  }
  return <div>{noResultText}</div>
}

SearchResultTable.defaultProps = {
  rowClickFn: () => null,
  selectable: false,
  definition: false
}

SearchResultTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(array).isRequired,
  rowClickFn: func,
  noResultText: string.isRequired,
  selectable: bool,
  definition: bool
}

export default SearchResultTable

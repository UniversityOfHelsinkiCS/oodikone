import React from 'react'
import { Table, Segment } from 'semantic-ui-react'
import { arrayOf, array, string, func, bool } from 'prop-types'

import './searchResultsTable.css'

const getHeaderRow = headers => (
  <Table.Header>
    <Table.Row>
      {headers.map(header => (
        <Table.HeaderCell key={`header-${header}`}>{header}</Table.HeaderCell>
      ))}
    </Table.Row>
  </Table.Header>
)

const getTableBody = (rows, rowClickFn, selectable, actionTrigger) => (
  <Table.Body>
    {rows.map((row, i) => (
      <Table.Row
        className={selectable ? 'selectableRow' : ''}
        // eslint-disable-next-line react/no-array-index-key
        key={`row-${i}`}
        onClick={e => rowClickFn(e, row)}
      >
        {Object.values(row).map((value, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Table.Cell key={`cell-${index}`}>
            {!!actionTrigger && index === 0 && actionTrigger(row)}
            {value}
          </Table.Cell>
        ))}
      </Table.Row>
    ))}
  </Table.Body>
)

const SearchResultTable = ({ actionTrigger, headers, rows, rowClickFn, noResultText, selectable, definition }) => {
  if (rows.length > 0) {
    return (
      <Segment style={{ maxHeight: '80vh', overflowY: 'auto', padding: 0 }}>
        <Table unstackable selectable={selectable} definition={definition} className="fixed-header">
          {getHeaderRow(headers)}
          {getTableBody(rows, rowClickFn, selectable, actionTrigger)}
        </Table>
      </Segment>
    )
  }
  return <div>{noResultText}</div>
}

SearchResultTable.defaultProps = {
  rowClickFn: () => null,
  selectable: false,
  definition: false,
  actionTrigger: null
}

SearchResultTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(array).isRequired,
  rowClickFn: func,
  noResultText: string.isRequired,
  selectable: bool,
  definition: bool,
  actionTrigger: func
}

export default SearchResultTable

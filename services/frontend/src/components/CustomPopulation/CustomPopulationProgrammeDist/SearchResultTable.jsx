import { array, arrayOf, bool, func, string } from 'prop-types'
import { Segment, Table } from 'semantic-ui-react'

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

const getTableBody = (rows, selectable, actionTrigger) => (
  <Table.Body>
    {rows.map((row, i) => (
      <Table.Row
        className={selectable ? 'selectableRow' : ''}
        // eslint-disable-next-line react/no-array-index-key
        key={`row-${i}`}
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

export const SearchResultTable = ({ actionTrigger, headers, rows, noResultText, selectable }) => {
  if (rows.length > 0) {
    return (
      <Segment style={{ maxHeight: '80vh', overflowY: 'auto', padding: 0 }}>
        <Table className="fixed-header" definition={false} selectable={selectable} unstackable>
          {getHeaderRow(headers)}
          {getTableBody(rows, selectable, actionTrigger)}
        </Table>
      </Segment>
    )
  }
  return <div>{noResultText}</div>
}

SearchResultTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(array).isRequired,
  noResultText: string.isRequired,
  selectable: bool.isRequired,
  actionTrigger: func.isRequired,
}

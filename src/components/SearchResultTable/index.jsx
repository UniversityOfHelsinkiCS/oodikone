import React from 'react'
import { Table, Icon } from 'semantic-ui-react'
import { arrayOf, string, object, func, bool, oneOfType, array } from 'prop-types'

import styles from './searchResultsTable.css'

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
          className={(selectable ? styles.selectableRow : '')}
          key={`row-${i}`} // eslint-disable-line react/no-array-index-key
          onClick={e => rowClickFn(e, row)}
        >
          {
            Object.values(row).map((value, index) => {
              if (index == 2) {
                return (
                  <Table.Cell key={`cell-${index}`}>
                    {row.passed || value.includes('Yes') ?
                      <Icon name="check circle outline" color="green" />
                      :
                      <Icon name="remove circle outline" color="red" />
                    }
                    {value}
                  </Table.Cell>
                )
              }
              return <Table.Cell key={`cell-${index}`}>{value}</Table.Cell> // eslint-disable-line react/no-array-index-key
            })

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
      >
        {getHeaderRow(headers)}
        {getTableBody(rows, rowClickFn, selectable, headers.length === 5)}
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
  rows: oneOfType([array, arrayOf(object)]).isRequired,
  rowClickFn: func,
  noResultText: string.isRequired,
  selectable: bool,
  definition: bool
}

export default SearchResultTable

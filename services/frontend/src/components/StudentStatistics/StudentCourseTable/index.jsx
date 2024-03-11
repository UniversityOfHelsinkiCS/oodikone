import { arrayOf, array, string } from 'prop-types'
import React from 'react'
import { Table, Segment } from 'semantic-ui-react'

const getHeaderRow = headers => (
  <Table.Header>
    <Table.Row>
      {headers.map(header => (
        <Table.HeaderCell key={`header-${header}`}>{header}</Table.HeaderCell>
      ))}
    </Table.Row>
  </Table.Header>
)

const getWidth = index => {
  if (index === 1) {
    return '4'
  }
  return '1'
}

const getTableBody = rows => (
  <Table.Body>
    {rows.map((row, i) => {
      const [highlight, ...rest] = Object.values(row)
      const style = highlight ? { backgroundColor: '#e8f4ff' } : null

      return (
        <Table.Row
          // eslint-disable-next-line react/no-array-index-key
          key={`row-${i}`}
          style={style}
        >
          {rest.map((value, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Table.Cell key={`cell-${index}`} width={getWidth(index)}>
              {value}
            </Table.Cell>
          ))}
        </Table.Row>
      )
    })}
  </Table.Body>
)

export const StudentCourseTable = ({ headers, rows, noResultText }) => {
  if (rows.length > 0) {
    return (
      <Segment style={{ padding: 0 }}>
        <Table unstackable>
          {getHeaderRow(headers)}
          {getTableBody(rows)}
        </Table>
      </Segment>
    )
  }
  return <div>{noResultText}</div>
}

StudentCourseTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(array).isRequired,
  noResultText: string.isRequired,
}

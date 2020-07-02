import React from 'react'
import { Table, Segment } from 'semantic-ui-react'
import { arrayOf, array, string } from 'prop-types'

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
    {rows.map((row, i) => (
      <Table.Row
        // eslint-disable-next-line react/no-array-index-key
        key={`row-${i}`}
      >
        {Object.values(row).map((value, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Table.Cell width={getWidth(index)} key={`cell-${index}`}>
            {value}
          </Table.Cell>
        ))}
      </Table.Row>
    ))}
  </Table.Body>
)

const StudentCourseTable = ({ headers, rows, noResultText }) => {
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
  noResultText: string.isRequired
}

export default StudentCourseTable

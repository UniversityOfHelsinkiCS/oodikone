import { array, arrayOf, string } from 'prop-types'
import { Table } from 'semantic-ui-react'

const courseNameColumnIndex = 1
const creditsColumnIndex = 3

const getHeaderRow = headers => (
  <Table.Header>
    <Table.Row>
      {headers.map((header, index) => (
        <Table.HeaderCell
          key={`header-${header}`}
          style={{ textAlign: index === creditsColumnIndex ? 'right' : 'left' }}
        >
          {header}
        </Table.HeaderCell>
      ))}
    </Table.Row>
  </Table.Header>
)

const getTableBody = rows => (
  <Table.Body>
    {rows.map((row, index) => {
      const [highlight, ...rest] = Object.values(row)
      const style = highlight ? { backgroundColor: '#e8f4ff' } : null
      return (
        <Table.Row
          // eslint-disable-next-line react/no-array-index-key
          key={`row-${index}`}
          style={style}
        >
          {rest.map((value, index) => (
            <Table.Cell
              // eslint-disable-next-line react/no-array-index-key
              key={`cell-${index}`}
              style={{ textAlign: index === creditsColumnIndex ? 'right' : 'left' }}
              width={index === courseNameColumnIndex ? 8 : 1}
            >
              {value}
            </Table.Cell>
          ))}
        </Table.Row>
      )
    })}
  </Table.Body>
)

export const StudentCourseTable = ({ headers, rows }) => {
  if (rows.length > 0) {
    return (
      <Table>
        {getHeaderRow(headers)}
        {getTableBody(rows)}
      </Table>
    )
  }
  return <div>Student has courses marked</div>
}

StudentCourseTable.propTypes = {
  headers: arrayOf(string).isRequired,
  rows: arrayOf(array).isRequired,
}

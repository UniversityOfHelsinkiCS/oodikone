import React from 'react'
import { Table } from 'semantic-ui-react'

import NoDataMessage from '../NoDataMessage'

const DataTable = ({ data, titles, track }) => {
  if (!data || !data[track]?.length || !titles)
    return <NoDataMessage message="No progress data found for the studytrack. Try with another studytrack" />

  const copy = [...data[track]]
  const sortedData = copy.sort((a, b) => {
    if (a[0] === 'Total') return -1
    if (b[0] === 'Total') return 1
    if (a[0] < b[0]) return -1
    if (a[0] > b[0]) return 1
    return 0
  })

  sortedData.reverse()

  return (
    <div className="table-container">
      <Table data-cy="Table-StudytrackProgress" compact celled>
        <Table.Header>
          <Table.Row>
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {sortedData.map(array => (
            <Table.Row key={`random-year-key-${Math.random()}`}>
              {array.map(value => (
                <Table.Cell
                  className={array[0] === 'Total' ? 'total-row-cell' : ''}
                  key={`random-key-${Math.random()}`}
                >
                  {value}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default DataTable

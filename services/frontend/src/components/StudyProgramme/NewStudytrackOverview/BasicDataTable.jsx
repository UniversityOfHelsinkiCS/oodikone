import React from 'react'
import { Table } from 'semantic-ui-react'

import NoDataMessage from '../NoDataMessage'

const DataTable = ({ data, titles, track }) => {
  if (!data || !data[track]?.length || !titles)
    return <NoDataMessage message="No progress data found for the studytrack. Try with another studytrack" />

  return (
    <div className="table-container">
      <Table celled>
        <Table.Header>
          <Table.Row>
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data[track].map(array => (
            <Table.Row key={`random-year-key-${Math.random()}`}>
              {array.map(value => (
                <Table.Cell key={`random-key-${Math.random()}`}>{value}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default DataTable

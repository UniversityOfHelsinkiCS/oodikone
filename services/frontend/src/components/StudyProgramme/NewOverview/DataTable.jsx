import React from 'react'
import { Table } from 'semantic-ui-react'

const DataTable = ({ data, titles, wideTable }) => {
  if (!data || !titles) return null

  return (
    <div className={`table-container${wideTable ? '-wide' : ''}`}>
      <Table celled>
        <Table.Header>
          <Table.Row>
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data?.map(yearArray => (
            <Table.Row key={`random-year-key-${Math.random()}`}>
              {yearArray?.map(value => (
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

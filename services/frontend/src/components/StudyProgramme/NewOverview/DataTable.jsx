import React from 'react'
import { Table } from 'semantic-ui-react'

const DataTable = ({ data, titles }) => {
  if (!data || !titles) return null

  return (
    <div className="table-container">
      <Table celled>
        <Table.Header>
          <Table.Row>
            {titles?.map(title => (
              <Table.HeaderCell>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data?.map(yearArray => (
            <Table.Row>
              {yearArray?.map(value => (
                <Table.Cell>{value}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default DataTable

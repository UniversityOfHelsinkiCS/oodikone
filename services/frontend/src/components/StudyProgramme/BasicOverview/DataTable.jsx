import React from 'react'
import { Table } from 'semantic-ui-react'

export const DataTable = ({ cypress, data, titles, wideTable }) => {
  if (!data || !titles) return null

  const textAlign = (value, index) => {
    if (index === 0) return 'center'
    return Number.isInteger(value) ? 'right' : 'left'
  }

  return (
    <div className={`table-container${wideTable ? '-wide' : ''}`}>
      <Table celled data-cy={`Table-${cypress}`}>
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
              {yearArray?.map((value, index) => (
                <Table.Cell key={`random-key-${Math.random()}`} textAlign={textAlign(value, index)}>
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

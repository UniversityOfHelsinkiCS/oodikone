import React, { useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'

const getKey = year => `${year.year}-${Math.random()}`

const getYearCell = (year, show) => {
  if (year?.data.length === 1) {
    return <Table.Cell key={getKey(year)}>{year.year}</Table.Cell>
  }
  return (
    <Table.Cell key={getKey(year)}>
      <Icon name={`${show ? 'angle down' : 'angle right'}`} />
      {year.year}
    </Table.Cell>
  )
}

const getRow = (year, array, show, setShow) => {
  if (array[0] === 'TOTAL') {
    return (
      <Table.Row key={getKey(year)} className="header-row" onClick={() => setShow(!show)}>
        {array.map(value =>
          value === 'TOTAL' ? getYearCell(year, show) : <Table.Cell key={getKey(year)}>{value}</Table.Cell>
        )}
      </Table.Row>
    )
  }

  if (show) {
    return (
      <Table.Row key={getKey(year)} className="regular-row">
        {array.map(value => (
          <Table.Cell key={getKey(year)}>{value}</Table.Cell>
        ))}
      </Table.Row>
    )
  }

  return null
}

const StudytrackDataTable = ({ data, titles }) => {
  const [show, setShow] = useState(false)

  if (!data) return null

  return (
    <div className="datatable">
      <Table>
        <Table.Header>
          <Table.Row>
            {titles.map((title, index) => (
              <Table.HeaderCell
                key={title}
                colSpan={index === 0 ? 1 : 2}
                textAlign="left"
                style={{ fontWeight: 'bold', paddingLeft: '50px' }}
              >
                {title}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>{data?.data?.map(year => year.data.map(array => getRow(year, array, show, setShow)))}</Table.Body>
      </Table>
    </div>
  )
}

export default StudytrackDataTable

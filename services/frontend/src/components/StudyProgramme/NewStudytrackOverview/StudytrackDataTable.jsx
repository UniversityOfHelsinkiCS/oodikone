import React, { useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'

const getKey = year => `${year}-${Math.random()}`

const getYearCell = (yearlyData, year, show) => {
  if (yearlyData.length === 1) {
    return <Table.Cell key={getKey(year)}>{year}</Table.Cell>
  }
  return (
    <Table.Cell key={getKey(year)}>
      <Icon name={`${show ? 'angle down' : 'angle right'}`} />
      {year}
    </Table.Cell>
  )
}

const getRow = ({ yearlyData, array, show, setShow }) => {
  if (array[0].includes('20')) {
    return (
      <Table.Row key={getKey(array[0])} className="header-row" onClick={() => setShow(!show)}>
        {array.map((value, index) =>
          index === 0 ? (
            getYearCell(yearlyData, array[0], show)
          ) : (
            <Table.Cell key={getKey(array[0])}>{value}</Table.Cell>
          )
        )}
      </Table.Row>
    )
  }

  if (show) {
    return (
      <Table.Row key={getKey(array[0])} className="regular-row">
        {array.map(value => (
          <Table.Cell key={getKey(array[0])}>{value}</Table.Cell>
        ))}
      </Table.Row>
    )
  }

  return null
}

const StudytrackDataTable = ({ data, titles }) => {
  const [show, setShow] = useState(false)

  if (!data) return null

  const sortedMainStats = Object.values(data)
    .reverse()
    .sort((a, b) => a[0] - b[0])

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

        <Table.Body>
          {sortedMainStats?.map(yearlyData => yearlyData.map(array => getRow({ yearlyData, array, show, setShow })))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default StudytrackDataTable

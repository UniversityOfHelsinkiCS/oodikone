import React, { useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'

const getKey = year => `${year}-${Math.random()}`

const getFirstCell = (yearlyData, year, show, singleTrack) => {
  if (yearlyData.length === 1 || singleTrack) {
    return <Table.Cell key={getKey(year)}>{year}</Table.Cell>
  }
  return (
    <Table.Cell key={getKey(year)}>
      <Icon name={`${show ? 'angle down' : 'angle right'}`} />
      {year}
    </Table.Cell>
  )
}

const getRow = ({ yearlyData, array, show, setShow, singleTrack }) => {
  if (array[0].includes('20') && !singleTrack) {
    return (
      <Table.Row key={getKey(array[0])} className="header-row" onClick={() => setShow(!show)}>
        {array.map((value, index) =>
          index === 0 ? (
            getFirstCell(yearlyData, array[0], show, singleTrack)
          ) : (
            <Table.Cell textAlign="left">{value}</Table.Cell>
          )
        )}
      </Table.Row>
    )
  }

  if (show || singleTrack) {
    return (
      <Table.Row key={getKey(array[0])} className="regular-row">
        {array.map((value, index) =>
          index === 0 && !singleTrack ? (
            <Table.Cell textAlign="left" style={{ paddingLeft: '50px' }} key={getKey(array[0])}>
              {value}
            </Table.Cell>
          ) : (
            <Table.Cell textAlign="left" key={getKey(array[0])}>
              {value}
            </Table.Cell>
          )
        )}
      </Table.Row>
    )
  }

  return null
}

const StudytrackDataTable = ({ dataOfAllTracks, dataOfSingleTrack, titles }) => {
  const [show, setShow] = useState(false)

  if (!dataOfAllTracks && !dataOfSingleTrack) return null

  const sortedMainStats = []
  Object.values(dataOfAllTracks).forEach(arrays => {
    if (arrays.length) {
      const copy = [...arrays]
      const sortedYear = copy.sort((a, b) => {
        if (a[0] < b[0]) return 1
        if (a[0] > b[0]) return -1
        return 0
      })
      sortedMainStats.push(sortedYear.reverse())
    }
  })

  sortedMainStats.reverse()

  return (
    <div className="datatable">
      <Table celled>
        <Table.Header>
          <Table.Row>
            {titles.map((title, index) => (
              <Table.HeaderCell
                key={title}
                colSpan={index === 0 ? 1 : 2}
                textAlign="left"
                style={{ fontWeight: 'bold' }}
              >
                {title}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {dataOfSingleTrack
            ? dataOfSingleTrack.map(array =>
                getRow({ yearlyData: dataOfSingleTrack, array, show, setShow, singleTrack: true })
              )
            : sortedMainStats?.map(yearlyData => yearlyData.map(array => getRow({ yearlyData, array, show, setShow })))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default StudytrackDataTable

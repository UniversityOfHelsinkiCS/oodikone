import React, { useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'
import * as _ from 'lodash'

import PopulationLink from './PopulationLink'

const getKey = year => `${year}-${Math.random()}`

const getFirstCell = (yearlyData, year, show, studyprogramme) => {
  return (
    <Table.Cell key={getKey(year)}>
      {yearlyData.length > 1 && <Icon name={`${show ? 'angle down' : 'angle right'}`} />}
      {year}
      <PopulationLink studyprogramme={studyprogramme} year={year} />
    </Table.Cell>
  )
}

const getSingleTrackRow = ({ yearlyData, row, studyprogramme, code }) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]
  return (
    <Table.Row key={getKey(row[0])} className="regular-row">
      {row.map((value, index) => (
        <Table.Cell textAlign="left" key={getKey(row[0])}>
          {value}
          {index === 0 && <PopulationLink studyprogramme={studyprogramme} year={year} studytrack={code} />}
        </Table.Cell>
      ))}
    </Table.Row>
  )
}

const getRow = ({ yearlyData, row, show, setShow, studyprogramme, studytracks }) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]

  // Get row for the studyprogramme
  if (row[0].includes('20')) {
    return (
      <Table.Row key={getKey(row[0])} className="header-row" onClick={() => setShow(!show)}>
        {row.map((value, index) =>
          index === 0 ? (
            getFirstCell(yearlyData, row[0], show, studyprogramme)
          ) : (
            <Table.Cell textAlign="left">{value}</Table.Cell>
          )
        )}
      </Table.Row>
    )
  }

  // Get row for any possible studytrack under the header studyprogramme row, if they are folded open
  if (show) {
    return (
      <Table.Row key={getKey(row[0])} className="regular-row">
        {row.map((value, index) =>
          index === 0 ? (
            <Table.Cell textAlign="left" style={{ paddingLeft: '50px' }} key={getKey(row[0])}>
              {value} {_.findKey(studytracks, value)}
              <PopulationLink
                studyprogramme={studyprogramme}
                year={year}
                studytrack={_.findKey(studytracks, s => s === value)}
              />
            </Table.Cell>
          ) : (
            <Table.Cell textAlign="left" key={getKey(row[0])}>
              {value}
            </Table.Cell>
          )
        )}
      </Table.Row>
    )
  }

  return null
}

const StudytrackDataTable = ({
  studyprogramme,
  dataOfAllTracks,
  studytracks,
  singleTrack,
  dataOfSingleTrack,
  titles,
}) => {
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
          {singleTrack
            ? dataOfSingleTrack.map(row =>
                getSingleTrackRow({ yearlyData: dataOfSingleTrack, row, studyprogramme, code: singleTrack })
              )
            : sortedMainStats?.map(yearlyData =>
                yearlyData.map(row => getRow({ yearlyData, row, studyprogramme, show, setShow, studytracks }))
              )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default StudytrackDataTable

import React, { useState } from 'react'
import { Icon, Radio, Table } from 'semantic-ui-react'
import * as _ from 'lodash'

import PopulationLink from './PopulationLink'

const getKey = year => `${year}-${Math.random()}`

const shouldBeHidden = (hidePercentages, value) => hidePercentages && typeof value === 'string' && value.includes('%')

const getFirstCell = (yearlyData, year, show, studyprogramme) => {
  return (
    <Table.Cell key={getKey(year)}>
      {yearlyData.length > 1 && <Icon name={`${show ? 'angle down' : 'angle right'}`} />}
      {year}
      <PopulationLink studyprogramme={studyprogramme} year={year} />
    </Table.Cell>
  )
}

const getSingleTrackRow = ({ row, studyprogramme, code, hidePercentages }) => {
  return (
    <Table.Row key={getKey(row[0])} className="regular-row">
      {row.map((value, index) => (
        <>
          {shouldBeHidden(hidePercentages, value) ? null : (
            <Table.Cell textAlign="left" key={getKey(row[0])}>
              {value}
              {index === 0 && <PopulationLink studyprogramme={studyprogramme} year={row[0]} studytrack={code} />}
            </Table.Cell>
          )}
        </>
      ))}
    </Table.Row>
  )
}

const getRow = ({ yearlyData, row, show, setShow, studyprogramme, studytracks, hidePercentages }) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]

  // Get row for the studyprogramme
  if (row[0].includes('20')) {
    return (
      <Table.Row key={getKey(row[0])} className="header-row" onClick={() => setShow(!show)}>
        {row.map((value, index) =>
          index === 0 ? (
            getFirstCell(yearlyData, row[0], show, studyprogramme)
          ) : (
            <>
              {shouldBeHidden(hidePercentages, value) ? null : (
                <Table.Cell key={getKey(value)} textAlign="left">
                  {value}
                </Table.Cell>
              )}
            </>
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
            <>
              {shouldBeHidden(hidePercentages, value) ? null : (
                <Table.Cell textAlign="left" key={getKey(row[0])}>
                  {value}
                </Table.Cell>
              )}
            </>
          )
        )}
      </Table.Row>
    )
  }

  return null
}

const sortTrackDataByYear = data => {
  if (!data || !data.length) return []

  const copy = [...data]
  const sortedData = copy.sort((a, b) => {
    if (a[0] < b[0]) return -1
    if (a[0] > b[0]) return 1
    return 0
  })

  sortedData.reverse()
  return sortedData
}

const sortMainDataByYear = data => {
  if (!data || !data.length) return []

  const sortedData = []
  data.forEach(arrays => {
    if (arrays.length) {
      const copy = [...arrays]
      const sortedYear = copy.sort((a, b) => {
        if (a[0] < b[0]) return 1
        if (a[0] > b[0]) return -1
        return 0
      })
      sortedData.push(sortedYear.reverse())
    }
  })

  sortedData.reverse()
  return sortedData
}

const getRadioButton = (toolTip, firstLabel, secondLabel, value, setValue) => (
  <div className="radio-toggle">
    <label className="toggle-label">{firstLabel}</label>
    <Radio toggle checked={value} onChange={() => setValue(!value)} />
    <label className="toggle-label">{secondLabel}</label>
  </div>
)

const StudytrackDataTable = ({
  studyprogramme,
  dataOfAllTracks,
  studytracks,
  singleTrack,
  dataOfSingleTrack,
  titles,
}) => {
  const [show, setShow] = useState(false)
  const [hidePercentages, setHidePercentages] = useState(false)

  if (!dataOfAllTracks && !dataOfSingleTrack) return null

  const sortedMainStats = sortMainDataByYear(Object.values(dataOfAllTracks))
  const sortedTrackStats = sortTrackDataByYear(dataOfSingleTrack)

  return (
    <div className="datatable">
      {getRadioButton(null, 'Show percentages', 'Hide percentages', hidePercentages, setHidePercentages)}
      <Table celled>
        <Table.Header>
          <Table.Row>
            {titles.map((title, index) => (
              <Table.HeaderCell
                key={title}
                colSpan={index === 0 || hidePercentages ? 1 : 2}
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
            ? sortedTrackStats.map(row =>
                getSingleTrackRow({ row, studyprogramme, code: singleTrack, hidePercentages })
              )
            : sortedMainStats?.map(yearlyData =>
                yearlyData.map(row =>
                  getRow({ yearlyData, row, studyprogramme, show, setShow, studytracks, hidePercentages })
                )
              )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default StudytrackDataTable

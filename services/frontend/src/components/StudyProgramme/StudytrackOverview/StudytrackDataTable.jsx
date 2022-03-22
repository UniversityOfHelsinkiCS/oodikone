import React, { useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'
import * as _ from 'lodash'

import PopulationLink from './PopulationLink'
import Toggle from '../Toggle'

const getKey = year => `${year}-${Math.random()}`

const shouldBeHidden = (hidePercentages, value) => hidePercentages && typeof value === 'string' && value.includes('%')

const getCellClass = value => (value === 'Total' ? 'total-row-cell' : '')

const getFirstCell = ({ yearlyData, year, show, studyprogramme, calendarYears }) => {
  return (
    <Table.Cell key={getKey(year)} className={getCellClass(year)}>
      {yearlyData.length > 1 && <Icon name={`${show ? 'angle down' : 'angle right'}`} />}
      {year}
      <PopulationLink studyprogramme={studyprogramme} year={year} years={calendarYears} />
    </Table.Cell>
  )
}

const getSingleTrackRow = ({ row, studyprogramme, code, hidePercentages, calendarYears }) => {
  return (
    <Table.Row key={getKey(row[0])} className="regular-row">
      {row.map((value, index) => (
        <>
          {shouldBeHidden(hidePercentages, value) ? null : (
            <Table.Cell textAlign="left" className={getCellClass(row[0])} key={getKey(row[0])}>
              {value}
              {index === 0 && (
                <PopulationLink studyprogramme={studyprogramme} year={row[0]} studytrack={code} years={calendarYears} />
              )}
            </Table.Cell>
          )}
        </>
      ))}
    </Table.Row>
  )
}

const getRow = ({
  yearlyData,
  row,
  show,
  setShow,
  studyprogramme,
  studytracks,
  hidePercentages,
  years,
  calendarYears,
}) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]

  // Get row for the studyprogramme
  if (years.includes(row[0])) {
    return (
      <Table.Row key={getKey(row[0])} className="header-row" onClick={() => setShow(!show)}>
        {row.map((value, index) =>
          index === 0 ? (
            getFirstCell({ yearlyData, year: row[0], show, studyprogramme, calendarYears })
          ) : (
            <>
              {shouldBeHidden(hidePercentages, value) ? null : (
                <Table.Cell className={getCellClass(row[0])} key={getKey(value)} textAlign="left">
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
                years={calendarYears}
                studytrack={_.findKey(studytracks, s => s === value)}
              />
            </Table.Cell>
          ) : (
            <>
              {shouldBeHidden(hidePercentages, value) ? null : (
                <Table.Cell className={getCellClass(row[0])} textAlign="left" key={getKey(row[0])}>
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
    if (a[0] === 'Total') return -1
    if (b[0] === 'Total') return 1
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
        if (a[0] === 'Total') return 1
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

const StudytrackDataTable = ({
  studyprogramme,
  dataOfAllTracks,
  studytracks,
  singleTrack,
  dataOfSingleTrack,
  titles,
  years,
}) => {
  const [show, setShow] = useState(false)
  const [hidePercentages, setHidePercentages] = useState(false)

  if (!dataOfAllTracks && !dataOfSingleTrack) return null

  const sortedMainStats = sortMainDataByYear(Object.values(dataOfAllTracks))
  const sortedTrackStats = sortTrackDataByYear(dataOfSingleTrack)
  const calendarYears = years.reduce((all, year) => {
    if (year === 'Total') return all
    return all.concat(Number(year.slice(0, 4)))
  }, [])

  return (
    <div className="datatable">
      <Toggle
        firstLabel="Show percentages"
        secondLabel="Hide percentages"
        value={hidePercentages}
        setValue={setHidePercentages}
      />
      <Table data-cy="Table-StudytrackOverview" celled>
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
                getSingleTrackRow({ row, studyprogramme, code: singleTrack, hidePercentages, years, calendarYears })
              )
            : sortedMainStats?.map(yearlyData =>
                yearlyData.map(row =>
                  getRow({
                    yearlyData,
                    row,
                    studyprogramme,
                    show,
                    setShow,
                    studytracks,
                    hidePercentages,
                    years,
                    calendarYears,
                  })
                )
              )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default StudytrackDataTable

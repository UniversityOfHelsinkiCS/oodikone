import React, { useState } from 'react'
import { Icon, Popup, Table } from 'semantic-ui-react'

import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { PopulationLink } from './PopulationLink'
import { Toggle } from '../Toggle'

const getKey = year => `${year}-${Math.random()}`

const shouldBeHidden = (showPercentages, value) => !showPercentages && typeof value === 'string' && value.includes('%')

const getCellClass = value => (value === 'Total' ? 'total-row-cell' : '')

const getSpanValue = (idx, showPercentages, combinedProgramme) => {
  if (combinedProgramme && showPercentages) return idx + 2
  if (combinedProgramme) return idx + 1
  return idx
}
const getStyleForBasic = idx => {
  if ([4, 12].includes(idx)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 5, 8, 9, 12, 13, 16, 17, 20, 21].includes(idx)) return { backgroundColor: '#f9f9f9' }
  if (idx === 18) return { borderLeftWidth: 'thick' }
  return {}
}
const getStyleForCombined = idx => {
  if ([4, 20].includes(idx)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 5, 8, 9, 12, 13, 16, 17, 21].includes(idx)) return { backgroundColor: '#f9f9f9' }
  if ([14].includes(idx)) return { borderLeftWidth: 'thick' }
  return {}
}

const createCountriesContent = ({ year, studyprogramme, otherCountriesStats }) => {
  if (!otherCountriesStats || !otherCountriesStats[studyprogramme] || !otherCountriesStats[studyprogramme][year])
    return <p key={Math.random()}>No data</p>
  const countriesData = otherCountriesStats[studyprogramme][year]
  return Object.keys(countriesData)
    .sort()
    .map(key => (
      <p key={Math.random()} style={{ margin: 0 }}>
        {key}: <b>{countriesData[key]}</b>
      </p>
    ))
}

const getBasicTableCell = ({ row, value, combinedProgramme, index }) => {
  return (
    <Table.Cell
      textAlign="left"
      className={getCellClass(row[0])}
      key={getKey(value)}
      style={combinedProgramme ? getStyleForCombined(index) : getStyleForBasic(index)}
    >
      {value}
    </Table.Cell>
  )
}

const getCountriesPopup = ({ index, combinedProgramme, value, row, year, studyprogramme, otherCountriesStats }) => {
  return (
    <Popup
      key={`${row[0]}-${getKey(value)}`}
      content={createCountriesContent({ year, studyprogramme, otherCountriesStats })}
      trigger={getBasicTableCell({ row, value, combinedProgramme, index })}
    />
  )
}

const getFirstCell = ({
  yearlyData,
  year,
  show,
  studyprogramme,
  calendarYears,
  combinedProgramme,
  setShow,
  allRights,
  isAdmin,
}) => {
  return (
    <Table.Cell key={getKey(year)} className={getCellClass(year)} onClick={setShow}>
      {yearlyData.length > 1 && <Icon name={`${show ? 'angle down' : 'angle right'}`} />}
      {year}
      {(isAdmin || allRights.includes(studyprogramme) || allRights.includes(combinedProgramme)) && (
        <PopulationLink
          studyprogramme={studyprogramme}
          year={year}
          years={calendarYears}
          combinedProgramme={combinedProgramme}
        />
      )}
    </Table.Cell>
  )
}

const getSingleTrackRow = ({
  row,
  studyprogramme,
  code,
  showPercentages,
  calendarYears,
  combinedProgramme,
  otherCountriesStats,
  allRights,
  isAdmin,
}) => {
  return (
    <Table.Row key={getKey(row[0])} className="regular-row">
      {row.map((value, index) => {
        if (shouldBeHidden(showPercentages, value)) return null
        if (index === row.length - 2 && otherCountriesStats)
          return getCountriesPopup({
            index,
            combinedProgramme,
            value,
            row,
            year: row[0],
            studyprogramme: code,
            otherCountriesStats,
          })
        return (
          <Table.Cell
            textAlign="left"
            className={getCellClass(row[0])}
            style={combinedProgramme ? getStyleForCombined(index) : getStyleForBasic(index)}
            key={getKey(row[0])}
          >
            {value}
            {index === 0 &&
              (isAdmin || allRights.includes(studyprogramme) || allRights.includes(combinedProgramme)) && (
                <PopulationLink
                  studyprogramme={studyprogramme}
                  year={row[0]}
                  studytrack={code}
                  years={calendarYears}
                  combinedProgramme={combinedProgramme}
                />
              )}
          </Table.Cell>
        )
      })}
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
  showPercentages,
  years,
  calendarYears,
  combinedProgramme,
  otherCountriesStats,
  getTextIn,
  allRights,
  isAdmin,
}) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]
  // Get row for the studyprogramme
  if (years.includes(row[0])) {
    return (
      <Table.Row key={getKey(row[0])} className="header-row">
        {row.map((value, index) => {
          if (shouldBeHidden(showPercentages, value)) return null
          if (index === 0)
            return getFirstCell({
              yearlyData,
              year: row[0],
              show,
              studyprogramme,
              calendarYears,
              combinedProgramme,
              setShow,
              allRights,
              isAdmin,
            })
          if (index === row.length - 2 && otherCountriesStats)
            return getCountriesPopup({
              index,
              combinedProgramme,
              value,
              row,
              year: row[0],
              studyprogramme,
              otherCountriesStats,
            })
          return getBasicTableCell({ row, value, combinedProgramme, index })
        })}
      </Table.Row>
    )
  }

  // Get row for any possible studytrack under the header studyprogramme row, if they are folded open
  if (show) {
    const correctStudytrack = row[0].split(', ')[1]
    const title = `${getTextIn(studytracks[correctStudytrack])}, ${correctStudytrack}`
    return (
      <Table.Row key={getKey(row[0])} className="regular-row">
        {row.map((value, index) => {
          if (shouldBeHidden(showPercentages, value)) return null
          if (index === 0) {
            return (
              <Table.Cell textAlign="left" style={{ paddingLeft: '50px' }} key={getKey(row[0])}>
                {title}
                {(isAdmin || allRights.includes(studyprogramme) || allRights.includes(combinedProgramme)) && (
                  <PopulationLink
                    studyprogramme={studyprogramme}
                    year={year}
                    years={calendarYears}
                    studytrack={correctStudytrack}
                    combinedProgramme={combinedProgramme}
                  />
                )}
              </Table.Cell>
            )
          }
          if (index === row.length - 2 && otherCountriesStats) {
            return getCountriesPopup({
              index,
              combinedProgramme,
              value,
              row,
              year,
              studyprogramme: correctStudytrack,
              otherCountriesStats,
            })
          }
          return getBasicTableCell({ row, value, combinedProgramme, index })
        })}
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
        if (b[0] === 'Total') return -1
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

export const StudytrackDataTable = ({
  studyprogramme,
  dataOfAllTracks,
  studytracks,
  singleTrack,
  dataOfSingleTrack,
  titles,
  years,
  combinedProgramme,
  otherCountriesStats,
}) => {
  const [show, setShow] = useState([])
  const [showPercentages, setShowPercentages] = useState(false)
  const { getTextIn } = useLanguage()
  const { rights, iamRights, isAdmin } = useGetAuthorizedUserQuery()
  const allRights = rights.concat(iamRights)
  if (!dataOfAllTracks && !dataOfSingleTrack) return null
  const firstCellClicked = index => {
    const newShow = [...show]
    show[index] = newShow[index] === undefined ? true : !show[index]
    setShow([...show])
  }

  const sortedMainStats = sortMainDataByYear(Object.values(dataOfAllTracks))
  const sortedTrackStats = sortTrackDataByYear(dataOfSingleTrack)
  const calendarYears = years.reduce((all, year) => {
    if (year === 'Total') return all
    return all.concat(Number(year.slice(0, 4)))
  }, [])
  const borderStyleArray = combinedProgramme ? [3, 8, 11] : [3, 7, 10]
  return (
    <div className="datatable">
      <Toggle
        firstLabel="Hide percentages"
        secondLabel="Show percentages"
        value={showPercentages}
        setValue={setShowPercentages}
      />
      <Table data-cy="Table-StudytrackOverview" celled>
        <Table.Header>
          <Table.Row key="FirstHeader">
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 4} />
            <Table.HeaderCell
              colSpan={
                !showPercentages
                  ? getSpanValue(4, showPercentages, combinedProgramme)
                  : getSpanValue(8, showPercentages, combinedProgramme)
              }
              style={{ borderLeftWidth: 'thick' }}
            >
              Status
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 6} style={{ borderLeftWidth: 'thick' }}>
              Gender
            </Table.HeaderCell>
            <Table.HeaderCell colSpan={!showPercentages ? 2 : 4} style={{ borderLeftWidth: 'thick' }}>
              <Popup
                trigger={
                  <div>
                    Countries <Icon name="question circle" />
                  </div>
                }
                content="Hover over 'Other' cell to see from which countries students are coming."
              />
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row key="Table-Studytrack-Titles">
            {titles.map((title, index) => (
              <Table.HeaderCell
                key={title}
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                textAlign="left"
                style={
                  borderStyleArray.includes(index)
                    ? { fontWeight: 'bold', borderLeftWidth: 'thick' }
                    : { fontWeight: 'bold' }
                }
              >
                {title}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        {(sortedMainStats || sortedTrackStats) && (
          <Table.Body>
            {singleTrack
              ? sortedTrackStats.map(row =>
                  getSingleTrackRow({
                    row,
                    studyprogramme,
                    code: singleTrack,
                    showPercentages,
                    years,
                    calendarYears,
                    combinedProgramme,
                    otherCountriesStats,
                    allRights,
                    isAdmin,
                  })
                )
              : sortedMainStats?.map((yearlyData, index) =>
                  yearlyData.map(row =>
                    getRow({
                      yearlyData,
                      row,
                      studyprogramme,
                      show: show[index],
                      setShow: () => firstCellClicked(index),
                      studytracks,
                      showPercentages,
                      years,
                      calendarYears,
                      combinedProgramme,
                      otherCountriesStats,
                      getTextIn,
                      index,
                      allRights,
                      isAdmin,
                    })
                  )
                )}
          </Table.Body>
        )}
      </Table>
    </div>
  )
}

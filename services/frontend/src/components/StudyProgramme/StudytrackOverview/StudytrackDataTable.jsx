import React, { useState } from 'react'
import { Icon, Popup, Table } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { PopulationLink } from './PopulationLink'

const getKey = year => `${year}-${Math.random()}`

const shouldBeHidden = (showPercentages, value) => !showPercentages && typeof value === 'string' && value.includes('%')

const getCellClass = value => (value === 'Total' ? 'total-row-cell' : '')

const getSpanValue = (combinedProgramme, index, showPercentages) => {
  if (combinedProgramme && showPercentages) return index + 2
  if (combinedProgramme) return index + 1
  return index
}

const getStyleForBasic = index => {
  if ([4, 12].includes(index)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 5, 8, 9, 12, 13, 16, 17, 20, 21].includes(index)) return { backgroundColor: '#f9f9f9' }
  if (index === 18) return { borderLeftWidth: 'thick' }
  return {}
}

const getStyleForCombined = index => {
  if ([4, 20].includes(index)) return { backgroundColor: '#f9f9f9', borderLeftWidth: 'thick' }
  if ([1, 5, 8, 9, 12, 13, 16, 17, 21].includes(index)) return { backgroundColor: '#f9f9f9' }
  if ([14].includes(index)) return { borderLeftWidth: 'thick' }
  return {}
}

const createCountriesContent = ({ otherCountriesStats, studyprogramme, year }) => {
  if (
    !otherCountriesStats ||
    !otherCountriesStats[studyprogramme] ||
    !otherCountriesStats[studyprogramme][year] ||
    Object.keys(otherCountriesStats[studyprogramme][year]).length === 0
  )
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

const getBasicTableCell = ({ combinedProgramme, index, row, value }) => {
  return (
    <Table.Cell
      className={getCellClass(row[0])}
      key={getKey(value)}
      style={combinedProgramme ? getStyleForCombined(index) : getStyleForBasic(index)}
      textAlign="right"
    >
      {value}
    </Table.Cell>
  )
}

const getCountriesPopup = ({ combinedProgramme, index, otherCountriesStats, row, studyprogramme, value, year }) => {
  return (
    <Popup
      content={createCountriesContent({ otherCountriesStats, studyprogramme, year })}
      key={`${row[0]}-${getKey(value)}`}
      trigger={getBasicTableCell({ combinedProgramme, index, row, value })}
    />
  )
}

const getFirstCell = ({
  allRights,
  calendarYears,
  combinedProgramme,
  isAdmin,
  setShow,
  show,
  studyprogramme,
  year,
  yearlyData,
}) => {
  return (
    <Table.Cell className={getCellClass(year)} key={getKey(year)} onClick={setShow}>
      {yearlyData.length > 1 && <Icon name={`${show ? 'angle down' : 'angle right'}`} />}
      {year}
      {(isAdmin || allRights.includes(studyprogramme) || allRights.includes(combinedProgramme)) && (
        <PopulationLink
          combinedProgramme={combinedProgramme}
          studyprogramme={studyprogramme}
          year={year}
          years={calendarYears}
        />
      )}
    </Table.Cell>
  )
}

const getSingleTrackRow = ({
  allRights,
  calendarYears,
  code,
  combinedProgramme,
  isAdmin,
  otherCountriesStats,
  row,
  showPercentages,
  studyprogramme,
}) => {
  return (
    <Table.Row className="regular-row" key={getKey(row[0])}>
      {row.map((value, index) => {
        if (shouldBeHidden(showPercentages, value)) return null
        if (index === row.length - 2 && otherCountriesStats)
          return getCountriesPopup({
            combinedProgramme,
            index,
            otherCountriesStats,
            row,
            studyprogramme: code,
            value,
            year: row[0],
          })
        return (
          <Table.Cell
            className={getCellClass(row[0])}
            key={getKey(row[0])}
            style={combinedProgramme ? getStyleForCombined(index) : getStyleForBasic(index)}
            textAlign="left"
          >
            {value}
            {index === 0 &&
              (isAdmin || allRights.includes(studyprogramme) || allRights.includes(combinedProgramme)) && (
                <PopulationLink
                  combinedProgramme={combinedProgramme}
                  studyprogramme={studyprogramme}
                  studytrack={code}
                  year={row[0]}
                  years={calendarYears}
                />
              )}
          </Table.Cell>
        )
      })}
    </Table.Row>
  )
}

const getRow = ({
  allRights,
  calendarYears,
  combinedProgramme,
  getTextIn,
  isAdmin,
  otherCountriesStats,
  row,
  setShow,
  show,
  showPercentages,
  studyprogramme,
  studytracks,
  years,
  yearlyData,
}) => {
  const year = yearlyData && yearlyData[0] && yearlyData[0][0]
  if (years.includes(row[0])) {
    return (
      <Table.Row className="header-row" key={getKey(row[0])}>
        {row.map((value, index) => {
          if (shouldBeHidden(showPercentages, value)) return null
          if (index === 0)
            return getFirstCell({
              allRights,
              calendarYears,
              combinedProgramme,
              isAdmin,
              setShow,
              show,
              studyprogramme,
              year: row[0],
              yearlyData,
            })
          if (index === row.length - 2 && otherCountriesStats)
            return getCountriesPopup({
              combinedProgramme,
              index,
              otherCountriesStats,
              row,
              studyprogramme,
              value,
              year: row[0],
            })
          return getBasicTableCell({ combinedProgramme, index, row, value })
        })}
      </Table.Row>
    )
  }

  // Get row for any possible studytrack under the header studyprogramme row, if they are folded open
  if (show) {
    const correctStudytrack = row[0].split(', ')[1]
    const title = `${getTextIn(studytracks[correctStudytrack])}, ${correctStudytrack}`
    return (
      <Table.Row className="regular-row" key={getKey(row[0])}>
        {row.map((value, index) => {
          if (shouldBeHidden(showPercentages, value)) return null
          if (index === 0) {
            return (
              <Table.Cell key={getKey(row[0])} style={{ paddingLeft: '50px' }} textAlign="left">
                {title}
                {(isAdmin || allRights.includes(studyprogramme) || allRights.includes(combinedProgramme)) && (
                  <PopulationLink
                    combinedProgramme={combinedProgramme}
                    studyprogramme={studyprogramme}
                    studytrack={correctStudytrack}
                    year={year}
                    years={calendarYears}
                  />
                )}
              </Table.Cell>
            )
          }
          if (index === row.length - 2 && otherCountriesStats) {
            return getCountriesPopup({
              combinedProgramme,
              index,
              otherCountriesStats,
              row,
              studyprogramme: correctStudytrack,
              value,
              year,
            })
          }
          return getBasicTableCell({ combinedProgramme, index, row, value })
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
  combinedProgramme,
  dataOfAllTracks,
  dataOfSingleTrack,
  otherCountriesStats,
  singleTrack,
  studyprogramme,
  studytracks,
  titles,
  years,
}) => {
  const [show, setShow] = useState([])
  const [showPercentages, setShowPercentages] = useState(false)
  const { getTextIn } = useLanguage()
  const { isAdmin, programmeRights } = useGetAuthorizedUserQuery()
  const allRights = programmeRights.map(({ code }) => code)
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
        setValue={setShowPercentages}
        value={showPercentages}
      />
      <Table celled data-cy="Table-StudytrackOverview">
        <Table.Header>
          <Table.Row key="FirstHeader">
            <Table.HeaderCell colSpan={!showPercentages ? 3 : 4} />
            <Table.HeaderCell
              colSpan={
                !showPercentages
                  ? getSpanValue(combinedProgramme, 4, showPercentages)
                  : getSpanValue(combinedProgramme, 8, showPercentages)
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
                content="Hover over 'Other' cell to see from which countries students are coming."
                trigger={
                  <div>
                    Countries <Icon name="question circle" />
                  </div>
                }
              />
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row key="Table-Studytrack-Titles">
            {titles.map((title, index) => (
              <Table.HeaderCell
                colSpan={index === 0 || index === 1 || !showPercentages ? 1 : 2}
                key={title}
                style={
                  borderStyleArray.includes(index)
                    ? { fontWeight: 'bold', borderLeftWidth: 'thick' }
                    : { fontWeight: 'bold' }
                }
                textAlign="center"
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
                    allRights,
                    calendarYears,
                    code: singleTrack,
                    combinedProgramme,
                    isAdmin,
                    otherCountriesStats,
                    row,
                    showPercentages,
                    studyprogramme,
                  })
                )
              : sortedMainStats?.map((yearlyData, index) =>
                  yearlyData.map(row =>
                    getRow({
                      allRights,
                      calendarYears,
                      combinedProgramme,
                      getTextIn,
                      index,
                      isAdmin,
                      otherCountriesStats,
                      row,
                      setShow: () => firstCellClicked(index),
                      show: show[index],
                      showPercentages,
                      studyprogramme,
                      studytracks,
                      years,
                      yearlyData,
                    })
                  )
                )}
          </Table.Body>
        )}
      </Table>
    </div>
  )
}
